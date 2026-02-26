import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessToken } from "@/lib/graph-token";
import { getGraphClient } from "@/lib/graph-client";

/**
 * GET /api/integrations/calendar/suggestions
 * Returns calendar events from the last 7 days that don't have
 * a corresponding time entry (by external_event_id), as suggestions.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const accessToken = await getAccessToken(session.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: "No hay cuenta de Microsoft vinculada" },
      { status: 404 }
    );
  }

  try {
    const client = getGraphClient(accessToken);

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await client
      .api("/me/calendarView")
      .query({
        startDateTime: sevenDaysAgo.toISOString(),
        endDateTime: now.toISOString(),
        $select: "id,subject,start,end,organizer,isAllDay",
        $orderby: "start/dateTime desc",
        $top: 50,
      })
      .get();

    const events: {
      id: string;
      subject: string;
      start: { dateTime: string };
      end: { dateTime: string };
      isAllDay: boolean;
      organizer?: { emailAddress?: { name?: string } };
    }[] = result.value || [];

    // Filter out all-day events
    const calendarEvents = events.filter((ev) => !ev.isAllDay);

    if (calendarEvents.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get event IDs that already have time entries
    const eventIds = calendarEvents.map((ev) => ev.id);
    const existingEntries = await prisma.timeEntry.findMany({
      where: {
        user_id: session.user.id,
        external_event_id: { in: eventIds },
        deleted_at: null,
      },
      select: { external_event_id: true },
    });

    const registeredIds = new Set(
      existingEntries.map((e) => e.external_event_id)
    );

    const suggestions = calendarEvents
      .filter((ev) => !registeredIds.has(ev.id))
      .map((ev) => {
        const start = new Date(ev.start.dateTime + "Z");
        const end = new Date(ev.end.dateTime + "Z");
        const durationHours =
          Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) /
          100;

        return {
          event_id: ev.id,
          subject: ev.subject,
          date: start.toISOString().split("T")[0],
          hours: Math.max(durationHours, 0.25),
          organizer: ev.organizer?.emailAddress?.name || null,
        };
      });

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener sugerencias del calendario" },
      { status: 502 }
    );
  }
}

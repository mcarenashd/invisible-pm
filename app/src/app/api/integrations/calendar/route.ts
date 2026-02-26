import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessToken } from "@/lib/graph-token";
import { getGraphClient } from "@/lib/graph-client";

/**
 * GET /api/integrations/calendar?from=date&to=date
 * Fetch Outlook calendar events for the authenticated user.
 */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Parámetros from y to son requeridos (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  try {
    const client = getGraphClient(accessToken);

    const startDateTime = new Date(from).toISOString();
    const endDateTime = new Date(to + "T23:59:59").toISOString();

    const result = await client
      .api("/me/calendarView")
      .query({
        startDateTime,
        endDateTime,
        $select: "subject,start,end,organizer,isAllDay",
        $orderby: "start/dateTime",
        $top: 100,
      })
      .get();

    const events = (result.value || [])
      .filter((ev: { isAllDay: boolean }) => !ev.isAllDay)
      .map(
        (ev: {
          id: string;
          subject: string;
          start: { dateTime: string; timeZone: string };
          end: { dateTime: string; timeZone: string };
          organizer?: { emailAddress?: { name?: string } };
        }) => {
          const start = new Date(ev.start.dateTime + "Z");
          const end = new Date(ev.end.dateTime + "Z");
          const durationHours =
            Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) /
            100;

          return {
            id: ev.id,
            subject: ev.subject,
            start: ev.start.dateTime,
            end: ev.end.dateTime,
            duration_hours: durationHours,
            organizer: ev.organizer?.emailAddress?.name || null,
          };
        }
      );

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener eventos del calendario" },
      { status: 502 }
    );
  }
}

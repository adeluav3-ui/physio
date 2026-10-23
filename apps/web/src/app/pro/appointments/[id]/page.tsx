import { redirect } from "next/navigation";

export default async function PhysioAppointmentDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/pro/session/${id}`);
}

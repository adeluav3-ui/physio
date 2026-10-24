import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAccess() {
    const jar = await cookies();
    if (!jar.get("physio_access")?.value) {
        redirect("/?locked=1");
    }
}

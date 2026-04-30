import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccount } from "../_components/delete-account";
import { getDeleteAccountBlockers } from "../actions";

export const metadata = { title: "Danger zone · Settings" };

export default async function DangerSettingsPage() {
  await getSessionUser(); // gate via the layout's session lookup; throws? no — layout already redirects unauth users.
  const blockers = await getDeleteAccountBlockers();

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          Permanently removes your account from every workspace you're in. Records you authored
          are reassigned to the remaining Owner. There is no undo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeleteAccount blockers={blockers} />
      </CardContent>
    </Card>
  );
}

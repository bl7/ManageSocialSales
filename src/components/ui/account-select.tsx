import { Select } from "@/components/ui/select";
import { FormGroup, Label } from "@/components/ui/page";

interface AccountOption {
  id: string;
  name: string;
}

export function AccountSelect({
  accounts,
  defaultAccountId,
  name = "account_id",
  label = "Account",
  required = true,
}: {
  accounts: AccountOption[];
  defaultAccountId?: string;
  name?: string;
  label?: string;
  required?: boolean;
}) {
  const defaultId = defaultAccountId || accounts.find((a) => a.name === "Cash")?.id || accounts[0]?.id;

  return (
    <FormGroup>
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Select id={name} name={name} defaultValue={defaultId} required={required}>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </Select>
    </FormGroup>
  );
}

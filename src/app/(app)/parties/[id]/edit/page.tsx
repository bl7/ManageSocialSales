import { notFound } from "next/navigation";
import { getPartyById } from "@/lib/queries/parties";
import { PartyForm } from "@/components/forms/party-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPartyPage({ params }: Props) {
  const { id } = await params;
  const party = await getPartyById(id);
  if (!party) notFound();

  return (
    <PartyForm
      party={{
        id: party.id,
        name: party.name,
        phone: party.phone,
        address: party.address,
        party_type: party.party_type,
        notes: party.notes,
      }}
    />
  );
}

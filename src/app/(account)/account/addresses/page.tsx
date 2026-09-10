import { listMyAddresses } from "@/server/actions/account-actions";
import { AddressManager } from "@/components/account/AddressManager";

export default async function AccountAddressesPage() {
  const addresses = await listMyAddresses();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Addresses</h1>
      <div className="mt-8">
        <AddressManager
          addresses={addresses.map((a) => ({
            id: a.id,
            recipientName: a.recipientName,
            line1: a.line1,
            line2: a.line2 ?? "",
            city: a.city,
            state: a.state,
            postalCode: a.postalCode,
            country: a.country,
            phone: a.phone ?? "",
            isDefault: a.isDefault,
          }))}
        />
      </div>
    </div>
  );
}

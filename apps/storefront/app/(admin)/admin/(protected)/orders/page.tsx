import prisma from "@/lib/prisma";
import OrdersTableClientWrapper from "@/components/admin/OrdersTableClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  // Fetch initial orders
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <OrdersTableClientWrapper initialOrders={orders as unknown as Parameters<typeof OrdersTableClientWrapper>[0]["initialOrders"]} />
    </div>
  );
}

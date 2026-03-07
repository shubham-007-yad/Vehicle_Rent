import { getRentalById } from "@/lib/actions";
import { PaymentForm } from "@/components/rentals/payment-form";
import { notFound } from "next/navigation";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  const { rental, error } = await getRentalById(id);

  if (error || !rental) {
    notFound();
  }

  // If already completed, redirect to history
  if (rental.status === "Completed") {
    // You might want to handle this differently, but for now let's just show it or redirect
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold italic">Final Payment & Settlement</h1>
        <p className="text-muted-foreground">Complete the transaction for {rental.customerName}.</p>
      </div>
      
      <PaymentForm rental={rental} />
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default async function DonationSuccessPage({
  searchParams,
}: {
  searchParams: {
    amount?: string;
    eventId?: string;
    eventTitle?: string;
  };
}) {
  const params = await searchParams;
  const amount = params.amount || "0";
  const eventId = params.eventId || "1";
  const eventTitle = params.eventTitle || "this fundraiser";

  return (
    <div className="container py-12 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Thank You for Your Donation!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-3xl font-bold text-primary">GH₵{amount}</p>
          <p className="text-muted-foreground">
            Your generous contribution to{" "}
            <span className="font-medium">{eventTitle}</span> has been received.
            Together, we're making a difference!
          </p>
          <div className="rounded-lg bg-primary-50 dark:bg-primary-900/30 p-4 mt-4">
            <p className="text-sm">
              A receipt has been sent to your email address. Thank you for your
              support!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href={`/events/${eventId}`} className="w-full">
            <Button variant="outline" className="w-full">
              Return to Fundraiser
            </Button>
          </Link>
          <Link href="/events" className="w-full">
            <Button variant="gradient" className="w-full">
              Explore More Fundraisers
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

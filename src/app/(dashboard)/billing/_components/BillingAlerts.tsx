import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface BillingAlertsProps {
  success?: string;
  plan?: string;
  topupSuccess?: boolean;
  topupCredits?: string;
  canceled?: string;
}

export function BillingAlerts({
  success,
  plan,
  topupSuccess,
  topupCredits,
  canceled,
}: BillingAlertsProps) {
  return (
    <>
      {success && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Subscription activated!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your {plan} plan is now active. Enjoy your credits!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {topupSuccess && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Credits added!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {topupCredits} credits have been added to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Checkout canceled
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No changes were made to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

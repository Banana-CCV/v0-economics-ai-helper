import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 gradient-mesh-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-teal-light/30">
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/70">
                We&apos;ve sent a confirmation email to your inbox. Click the link to verify your account and get
                started.
              </p>
              <p className="text-xs text-foreground/50">
                Didn&apos;t receive the email? Check your spam folder or try signing up again.
              </p>
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full border-teal-light/30 bg-transparent">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

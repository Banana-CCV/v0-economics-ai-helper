import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 gradient-mesh-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-teal-light/30">
            <CardHeader>
              <CardTitle className="text-2xl">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <p className="text-sm text-foreground/70">Error: {params.error}</p>
              ) : (
                <p className="text-sm text-foreground/70">An error occurred during authentication.</p>
              )}
              <Link href="/auth/login" className="block">
                <Button className="w-full bg-teal-accent hover:opacity-90">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

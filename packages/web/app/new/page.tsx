import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Editor } from "@/components/editor"
import { AuthWrapper } from "@/components/auth-wrapper"
import { ArrowLeft } from "lucide-react"

export default function NewPostPage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          <Editor mode="create" />
        </div>
      </div>
    </AuthWrapper>
  )
}

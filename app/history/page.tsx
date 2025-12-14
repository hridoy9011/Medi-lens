import { Header } from "@/components/header"
import { HistoryList } from "@/components/history-list"

export default function HistoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analysis History</h1>
          <p className="text-muted-foreground">View your past prescription analyses</p>
        </div>

        <HistoryList />
      </main>
    </div>
  )
}

import SCLogin from "@/components/server/SCLogin";

export default async function Login({searchParams}: {searchParams: {error: string}}) {
  const errorAttempt = parseInt(searchParams?.error || "0");

  return (
    <SCLogin errorAttempt={errorAttempt} />
  )
}

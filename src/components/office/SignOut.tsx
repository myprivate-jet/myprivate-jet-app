"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/server/actions/member";

export function SignOut() {
  const router = useRouter();
  return <button className="so" type="button" onClick={async () => { await signOut(); router.push("/"); }}>Sign out</button>;
}

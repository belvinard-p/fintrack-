import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { markLoginTime, setToken } from "@/lib/session";
import { startDemo } from "../services/auth-api";

/** "Try the demo": creates a sample-data account, signs in and opens the dashboard. */
export function useStartDemo() {
  const router = useRouter();
  return useMutation({
    mutationFn: startDemo,
    onSuccess: ({ access_token }) => {
      setToken(access_token);
      markLoginTime();
      router.push("/dashboard");
    },
  });
}

import { AuthProvider } from "@/components/AuthProvider";

export default function DevLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

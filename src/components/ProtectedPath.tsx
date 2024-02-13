import { useStore } from "@nanostores/react";
import { User } from "@supabase/supabase-js";
import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { $currUser } from "../global-state/user";
import { useUser } from "../supabase/loader";

interface ProtectedPathProps extends PropsWithChildren {
  redirectUrl: string;
  shouldRedirect?: (arg0: User | null) => boolean;
}

export const ProtectedPath = ({
  children,
  redirectUrl,
}: ProtectedPathProps) => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={redirectUrl} />;
  }

  return children;
};

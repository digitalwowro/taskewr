"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, isUnauthorizedError, requestJson } from "@/lib/api-client";

export type CurrentUserProfile = {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  workspaceId: number;
  workspaceRole: string;
  timezone: string | null;
};

export function useProfileState({ redirectToLogin }: { redirectToLogin: () => void }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [profileMutationPending, setProfileMutationPending] = useState(false);
  const [profileMutationError, setProfileMutationError] = useState<string | null>(null);

  const openProfileModal = () => {
    setProfileMutationError(null);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileMutationError(null);
    setProfileModalOpen(false);
  };

  const handleProfileSave = useCallback(
    async (input: {
      name: string;
      email: string;
      currentPassword: string;
      newPassword: string;
      avatarUrl: string | null;
    }) => {
      setProfileMutationPending(true);
      setProfileMutationError(null);

      try {
        const profile = await requestJson<CurrentUserProfile>(`/api/v1/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        setCurrentUserProfile(profile);
        setProfileModalOpen(false);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          redirectToLogin();
          return;
        }

        setProfileMutationError(
          error instanceof ApiRequestError ? error.message : "Failed to update profile.",
        );
      } finally {
        setProfileMutationPending(false);
      }
    },
    [redirectToLogin],
  );

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await requestJson<CurrentUserProfile>(`/api/v1/auth/me`);

        if (!cancelled) {
          setCurrentUserProfile(profile);
        }
      } catch (error) {
        if (!cancelled && isUnauthorizedError(error)) {
          redirectToLogin();
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [redirectToLogin]);

  return {
    profileModalOpen,
    currentUserProfile,
    profileMutationPending,
    profileMutationError,
    openProfileModal,
    closeProfileModal,
    handleProfileSave,
  };
}

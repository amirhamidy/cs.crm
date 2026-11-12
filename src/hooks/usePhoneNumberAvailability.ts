"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";

type ApiUser = {
  id: number;
  username: string;
  phone_number: string | null;
};

type AvailabilityResult = {
  usernameExists: boolean;
  phoneNumberExists: boolean;
  error: string;
};

function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneNumber(value: string) {
  const digits = toEnglishDigits(value).replace(/\D/g, "");

  if (digits.startsWith("0098") && digits.length === 14) {
    return `0${digits.slice(4)}`;
  }

  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
}

function extractUsers(data: unknown): ApiUser[] {
  if (Array.isArray(data)) {
    return data as ApiUser[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as Record<string, unknown>;

  if (Array.isArray(response.results)) {
    return response.results as ApiUser[];
  }

  if (Array.isArray(response.data)) {
    return response.data as ApiUser[];
  }

  if (Array.isArray(response.users)) {
    return response.users as ApiUser[];
  }

  return [];
}

export function useUserAvailability(username: string, phoneNumber: string) {
  const [isChecking, setIsChecking] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [phoneNumberExists, setPhoneNumberExists] = useState(false);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  const checkAvailability = useCallback(
    async (
      values?: Partial<{
        username: string;
        phoneNumber: string;
      }>,
    ): Promise<AvailabilityResult> => {
      const currentUsername = normalizeUsername(values?.username ?? username);
      const currentPhoneNumber = normalizePhoneNumber(
        values?.phoneNumber ?? phoneNumber,
      );

      const requestId = ++requestIdRef.current;

      if (!currentUsername && !currentPhoneNumber) {
        const emptyResult: AvailabilityResult = {
          usernameExists: false,
          phoneNumberExists: false,
          error: "",
        };

        setUsernameExists(false);
        setPhoneNumberExists(false);
        setError("");
        setIsChecking(false);

        return emptyResult;
      }

      setIsChecking(true);
      setError("");

      try {
        const { data } = await axiosInstance.get<ApiUser[]>(
          "/accounts/api/v1/user/list/",
        );

        const users = extractUsers(data);

        const nextUsernameExists =
          currentUsername.length > 0 &&
          users.some(
            (user) =>
              normalizeUsername(user.username ?? "") === currentUsername,
          );

        const nextPhoneNumberExists =
          currentPhoneNumber.length === 11 &&
          users.some(
            (user) =>
              normalizePhoneNumber(user.phone_number ?? "") ===
              currentPhoneNumber,
          );

        const result: AvailabilityResult = {
          usernameExists: nextUsernameExists,
          phoneNumberExists: nextPhoneNumberExists,
          error: "",
        };

        if (requestId === requestIdRef.current) {
          setUsernameExists(nextUsernameExists);
          setPhoneNumberExists(nextPhoneNumberExists);
          setError("");
        }

        return result;
      } catch {
        const result: AvailabilityResult = {
          usernameExists: false,
          phoneNumberExists: false,
          error: "خطا در بررسی تکراری بودن نام کاربری یا شماره موبایل",
        };

        if (requestId === requestIdRef.current) {
          setUsernameExists(false);
          setPhoneNumberExists(false);
          setError(result.error);
        }

        return result;
      } finally {
        if (requestId === requestIdRef.current) {
          setIsChecking(false);
        }
      }
    },
    [phoneNumber, username],
  );

  useEffect(() => {
    const currentUsername = normalizeUsername(username);
    const currentPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!currentUsername && !currentPhoneNumber) {
      requestIdRef.current += 1;
      setIsChecking(false);
      setUsernameExists(false);
      setPhoneNumberExists(false);
      setError("");
      return;
    }

    const timeout = window.setTimeout(() => {
      void checkAvailability({
        username: currentUsername,
        phoneNumber: currentPhoneNumber,
      });
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [checkAvailability, phoneNumber, username]);

  return {
    isChecking,
    usernameExists,
    phoneNumberExists,
    error,
    checkAvailability,
  };
}

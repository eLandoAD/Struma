import { useContext } from "react";
import { SignalingContext } from "../context/SignalingContext";

export function useSignaling() {
  const ctx = useContext(SignalingContext);
  if (!ctx) {
    throw new Error("useSignaling deve essere usato dentro <SignalingProvider>");
  }
  return ctx;
}

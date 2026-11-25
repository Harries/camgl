import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Live Webcam",
  description:
    "Partner & operator portal to submit official public scenic live webcams for free listing on LiveCam Global.",
  alternates: { canonical: "/submit" },
  openGraph: {
    title: "Submit a Live Webcam | LiveCam Global",
    description:
      "Partner & operator portal to submit official public scenic live webcams for free listing on LiveCam Global.",
    url: "/submit",
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomBar from "@/components/MobileBottomBar";
import CinematicIntro from "@/components/CinematicIntro";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CinematicIntro />
      <Header />
      <main className="flex-1 pt-16 md:pt-28 lg:pt-28 pb-28 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomBar />
    </>
  );
}

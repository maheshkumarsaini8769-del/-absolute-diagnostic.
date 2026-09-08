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
      <main className="flex-1 pt-16 lg:pt-20 pb-24 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomBar />
    </>
  );
}

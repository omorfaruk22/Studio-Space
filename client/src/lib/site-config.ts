export const siteName = "StudioSpace";

export const primaryNavigation = [
  { label: "Home", href: "/" },
  { label: "Explore Studios", href: "/studios" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/#about" },
] as const;

export const popularCategories = [
  { label: "Photo studios", href: "/studios?category=photo" },
  { label: "Podcast rooms", href: "/studios?category=podcast" },
  { label: "Music suites", href: "/studios?category=music" },
  { label: "Art workshops", href: "/studios?category=art" },
] as const;

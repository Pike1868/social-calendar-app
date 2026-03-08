import { lightTheme, darkTheme, tokens } from "./theme";

describe("Circl Design System Theme", () => {
  describe("Design Tokens", () => {
    it("defines correct primary colors", () => {
      expect(tokens.colors.primary).toBe("#1B5E20");
      expect(tokens.colors.primaryLight).toBe("#2E7D32");
      expect(tokens.colors.primaryDark).toBe("#0D3B13");
    });

    it("defines correct accent (gold) colors", () => {
      expect(tokens.colors.accent).toBe("#C6993A");
      expect(tokens.colors.accentLight).toBe("#D4AF61");
      expect(tokens.colors.accentDark).toBe("#A67C2E");
    });

    it("defines correct spacing base unit", () => {
      expect(tokens.spacing).toBe(4);
    });

    it("defines correct border radii", () => {
      expect(tokens.borderRadius.small).toBe(8);
      expect(tokens.borderRadius.medium).toBe(12);
      expect(tokens.borderRadius.large).toBe(16);
    });

    it("defines subtle, medium, and elevated shadows", () => {
      expect(tokens.shadows.subtle).toBe("0 1px 3px rgba(0,0,0,0.06)");
      expect(tokens.shadows.medium).toBe("0 4px 12px rgba(0,0,0,0.08)");
      expect(tokens.shadows.elevated).toBe("0 8px 24px rgba(0,0,0,0.10)");
    });
  });

  describe("Light Theme", () => {
    it("uses dark green as primary color", () => {
      expect(lightTheme.palette.primary.main).toBe("#1B5E20");
    });

    it("uses gold as secondary/accent color", () => {
      expect(lightTheme.palette.secondary.main).toBe("#C6993A");
    });

    it("has light mode palette", () => {
      expect(lightTheme.palette.mode).toBe("light");
      expect(lightTheme.palette.background.default).toBe("#FAFAFA");
      expect(lightTheme.palette.background.paper).toBe("#FFFFFF");
      expect(lightTheme.palette.text.primary).toBe("#111111");
    });

    it("sets correct font family", () => {
      expect(lightTheme.typography.fontFamily).toContain("-apple-system");
      expect(lightTheme.typography.fontFamily).toContain("SF Pro Display");
      expect(lightTheme.typography.fontFamily).toContain("Helvetica Neue");
    });

    it("sets heading font weight to 600", () => {
      expect(lightTheme.typography.h1.fontWeight).toBe(600);
      expect(lightTheme.typography.h2.fontWeight).toBe(600);
      expect(lightTheme.typography.h3.fontWeight).toBe(600);
    });

    it("uses 4px spacing base unit", () => {
      expect(lightTheme.spacing(1)).toBe("4px");
      expect(lightTheme.spacing(2)).toBe("8px");
      expect(lightTheme.spacing(4)).toBe("16px");
    });

    it("sets border radius to 8px", () => {
      expect(lightTheme.shape.borderRadius).toBe(8);
    });

    it("disables button text transform", () => {
      expect(lightTheme.typography.button.textTransform).toBe("none");
    });
  });

  describe("Dark Theme", () => {
    it("has dark mode palette", () => {
      expect(darkTheme.palette.mode).toBe("dark");
      expect(darkTheme.palette.background.default).toBe("#121212");
      expect(darkTheme.palette.background.paper).toBe("#1E1E1E");
      expect(darkTheme.palette.text.primary).toBe("#F5F5F5");
    });

    it("uses same primary and secondary colors as light theme", () => {
      expect(darkTheme.palette.primary.main).toBe(
        lightTheme.palette.primary.main
      );
      expect(darkTheme.palette.secondary.main).toBe(
        lightTheme.palette.secondary.main
      );
    });

    it("has dark divider color", () => {
      expect(darkTheme.palette.divider).toBe("#333333");
    });
  });
});

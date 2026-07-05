import { motion } from "framer-motion";

export const IdentitySplash = () => (
  <main className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
    <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand-pink/30 blur-[120px]" />
    <div className="absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-brand-purple/30 blur-[120px]" />
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center gap-4"
    >
      <span className="rounded-full gradient-brand px-6 py-2.5 text-xl font-extrabold text-white tracking-tight shadow-brand">
        Shopitt
      </span>
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground"
      >
        Loading your shelf
      </motion.span>
    </motion.div>
  </main>
);

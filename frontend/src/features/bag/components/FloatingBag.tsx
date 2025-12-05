import { motion } from "framer-motion";

const FloatingBag = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-6 left-6 z-30"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-2xl backdrop-blur bg-white/20 border border-white/30 p-4 shadow-lg"
      >
        <div className="w-24 h-24 flex items-center justify-center text-xs font-semibold text-foreground/60">
          3D Bag Placeholder
        </div>
        {/* <BagCanvas /> will go here when implemented */}
      </motion.div>
    </motion.div>
  );
};

export default FloatingBag;

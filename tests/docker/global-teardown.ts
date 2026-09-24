import { compose } from "./global-setup";

export default function globalTeardown() {
    // KEEP_STACK=1 laisse la pile en vie pour inspecter les logs apres un echec.
    if (process.env.KEEP_STACK) return;
    compose("down", "-v");
}

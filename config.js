/* =========================================================================
   CONFIGURATION — LeadSignal AI
   Le SEUL fichier à modifier pour brancher la page sur ton workflow n8n.
   Voir N8N_SETUP.md pour le pas-à-pas.
   ========================================================================= */

window.LEADSIGNAL_CONFIG = {
  /* URL du webhook n8n (nœud "Webhook" en tête du workflow).
     - En test  : copie l'URL "Test URL"       (n8n doit être en écoute / "Listen for test event")
     - En prod  : copie l'URL "Production URL"  (workflow activé)                                     */
  webhookUrl: "https://n8n.comptek.store/webhook/ee363f78-48a2-4081-9350-b434e2f6fc41",

  /* Timeout côté navigateur (ms). Un run synchrone peut être long :
     on laisse large pour ne pas couper avant la réponse de n8n.        */
  requestTimeoutMs: 180000, // 3 min

  /* Bornes du champ "nombre de leads max". */
  maxLeads: { min: 1, max: 1000, default: 100 },

  /* Mode démo : si true, aucun appel réseau — on simule une réponse
     après ~6 s pour tester l'UI sans n8n. Mets false pour le vrai run. */
  demoMode: false,
};

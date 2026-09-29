import { createContext, useContext } from "react";

export type Lang = "en" | "pt";

// Dicionário da interface (chrome). Padrão: inglês. PT como segundo idioma.
export const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.index": "Index",
    "nav.projects": "Projects",
    "index.scroll": "Scroll to enter",
    "view.grid": "Grid",
    "view.list": "List",
    "view.drag": "Drag to explore",
    "proj.category": "Category",
    "proj.client": "Client",
    "sound.toggle": "Toggle sound",
    "sound.on": "Sound on",
    "sound.off": "Sound off",
    "nav.about": "About",
    "nav.work": "All Works",
    "nav.nextwave": "Next Wave",
    "nav.contact": "Contact",
    "work.search": "search…",
    "work.all": "All",
    "work.projects": "projects",
    "work.empty": "No projects in",
    "home.selected": "Selected Works",
    "home.year": "Year",
    "home.allcta": "See all projects",
    "home.view": "View project",
    "work.alltitle": "All Works",
    "trusted.default": "Trusted by",
    "proj.next": "next",
    "proj.prev": "prev",
    "proj.year": "year",
    "proj.location": "location",
    "proj.credits": "credits",
    "contact.eyebrow": "Contact",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.instagram": "Instagram",
    "about.eyebrow": "About",
    "about.practice": "What we do",
    "about.clients": "Clients",
    "footer.getintouch": "Let's create something together.",
    "footer.getintouch.sub": "Drop us a line and let's talk about your next experience.",
    "footer.message": "Your message",
    "footer.menu": "Menu",
    "footer.contact": "Contact",
    "footer.follow": "Follow",
    "footer.theme": "Theme",
    "footer.rights": "All rights reserved.",
    "footer.backtotop": "back to top",
    "back.all": "all works",
    "back.default": "back",
    "save.saving": "saving…",
    "save.saved": "saved ✓",
    "save.error": "error ✕",
  },
  pt: {
    "nav.home": "Início",
    "nav.index": "Início",
    "nav.projects": "Projetos",
    "index.scroll": "Role para entrar",
    "view.grid": "Grade",
    "view.list": "Lista",
    "view.drag": "Arraste para explorar",
    "proj.category": "Categoria",
    "proj.client": "Cliente",
    "sound.toggle": "Ligar/desligar som",
    "sound.on": "Som ligado",
    "sound.off": "Som desligado",
    "nav.about": "Sobre",
    "nav.work": "Trabalhos",
    "nav.nextwave": "Next Wave",
    "nav.contact": "Contato",
    "work.search": "buscar…",
    "work.all": "Todos",
    "work.projects": "projetos",
    "work.empty": "Nenhum projeto em",
    "home.selected": "Trabalhos selecionados",
    "home.year": "Ano",
    "home.allcta": "Ver todos os projetos",
    "home.view": "Ver projeto",
    "work.alltitle": "Todos os trabalhos",
    "trusted.default": "Quem confia",
    "proj.next": "próximo",
    "proj.prev": "anterior",
    "proj.year": "ano",
    "proj.location": "local",
    "proj.credits": "créditos",
    "contact.eyebrow": "Contato",
    "contact.email": "E-mail",
    "contact.address": "Endereço",
    "contact.instagram": "Instagram",
    "about.eyebrow": "Sobre",
    "about.practice": "O que fazemos",
    "about.clients": "Clientes",
    "footer.getintouch": "Vamos criar algo juntos.",
    "footer.getintouch.sub": "Manda uma mensagem e a gente conversa sobre a sua próxima experiência.",
    "footer.message": "Sua mensagem",
    "footer.menu": "Menu",
    "footer.contact": "Contato",
    "footer.follow": "Redes",
    "footer.theme": "Tema",
    "footer.rights": "Todos os direitos reservados.",
    "footer.backtotop": "voltar ao topo",
    "back.all": "trabalhos",
    "back.default": "voltar",
    "save.saving": "salvando…",
    "save.saved": "salvo ✓",
    "save.error": "erro ✕",
  },
};

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

// Resolve um campo de conteúdo que pode ser bilíngue ({en, pt}) ou string simples.
export function resolveTx(v: any, lang: Lang): any {
  if (v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "pt" in v)) {
    return v[lang] ?? v.en ?? v.pt ?? "";
  }
  return v;
}

// Escreve num campo bilíngue preservando o outro idioma. Se o valor atual é
// string simples, migra para {en, pt} usando o texto atual como base.
export function writeTx(current: any, lang: Lang, value: string): { en: string; pt: string } {
  const base = current && typeof current === "object" && !Array.isArray(current)
    ? { en: current.en ?? "", pt: current.pt ?? "" }
    : { en: (current as string) ?? "", pt: (current as string) ?? "" };
  return { ...base, [lang]: value };
}

export function useLang() {
  const { lang, setLang } = useContext(LangContext);
  const t = (k: string) => STRINGS[lang]?.[k] ?? STRINGS.en[k] ?? k;
  const tx = (v: any) => resolveTx(v, lang);
  // Rótulo com fallback: se o valor é bilíngue ({en,pt}) usa-o; senão usa o
  // dicionário (assim os rótulos padrão trocam de idioma mesmo sendo string).
  const tl = (v: any, key: string) =>
    (v && typeof v === "object" && !Array.isArray(v) && ("en" in v || "pt" in v))
      ? resolveTx(v, lang)
      : t(key);
  return { lang, setLang, t, tx, tl, wx: (current: any, value: string) => writeTx(current, lang, value) };
}

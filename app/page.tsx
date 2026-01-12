"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation("home");

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex flex-col gap-6 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t("subtitle")}
        </p>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">{t("features.privacy.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("features.privacy.description")}
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">{t("features.search.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("features.search.description")}
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">{t("features.evolving.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("features.evolving.description")}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-2xl font-semibold mb-4">{t("howToUse.title")}</h3>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">{t("howToUse.browseTools.label")}</strong> {t("howToUse.browseTools.text")}
              </li>
              <li>
                <strong className="text-foreground">{t("howToUse.productivity.label")}</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: t("howToUse.productivity.text") }} />
              </li>
              <li>
                <strong className="text-foreground">{t("howToUse.whiteboard.label")}</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: t("howToUse.whiteboard.text") }} />
              </li>
              <li>
                <strong className="text-foreground">{t("howToUse.terms.label")}</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: t("howToUse.terms.text") }} />
              </li>
              <li>
                <strong className="text-foreground">{t("howToUse.feedback.label")}</strong>{" "}
                {t("howToUse.feedback.text").split(t("howToUse.feedback.linkText"))[0]}
                <a href="https://github.com/zafrem/Desk-tools/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{t("howToUse.feedback.linkText")}</a>
                {t("howToUse.feedback.text").split(t("howToUse.feedback.linkText"))[1]}
              </li>
            </ul>
          </div>
        </section>

        <section className="bg-muted/30 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-3">{t("roadmap.title")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("roadmap.description")}
          </p>
          <div className="flex gap-4">
             <Link href="https://github.com/zafrem/Desk-tools/issues/new" target="_blank" rel="noopener noreferrer">
                <Button>{t("roadmap.requestFeature")}</Button>
             </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
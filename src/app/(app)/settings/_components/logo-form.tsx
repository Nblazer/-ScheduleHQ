"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveLogoAction } from "../actions";

export function LogoForm({
  orgName,
  initialLogo,
}: {
  orgName: string;
  initialLogo: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction] = useFormState(saveLogoAction, null);
  const [preview, setPreview] = React.useState<string | null>(initialLogo);
  const [file, setFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state?.ok) {
      toast.success("Logo saved.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }, [state, router, toast]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (!f) {
      setPreview(initialLogo);
      return;
    }
    if (f.size > 256 * 1024) {
      toast.error("Image is too large — please use one under 256KB.");
      if (inputRef.current) inputRef.current.value = "";
      setFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPreview(reader.result);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={orgName} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="text-sm">
          <div className="font-medium">{orgName}</div>
          <div className="text-muted-foreground text-xs mt-1">
            PNG, JPEG, GIF, WebP, or SVG. Square images work best. Max 256KB.
          </div>
        </div>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          onChange={onPick}
          className="block text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:cursor-pointer hover:file:brightness-110 cursor-pointer text-muted-foreground"
        />
        <UploadButton disabled={!file} />
        {state && !state.ok ? <FieldError>{state.error}</FieldError> : null}
      </form>

      {initialLogo && (
        <form action={formAction}>
          <input type="hidden" name="remove" value="1" />
          <RemoveButton />
        </form>
      )}
    </div>
  );
}

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={disabled}>
      <Upload className="h-4 w-4" /> Upload
    </Button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" loading={pending}>
      <Trash2 className="h-3.5 w-3.5" /> Remove logo
    </Button>
  );
}

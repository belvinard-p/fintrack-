import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

function Combobox<Value, Multiple extends boolean | undefined = false>({
  ...props
}: ComboboxPrimitive.Root.Props<Value, Multiple>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />
}

function ComboboxValue({ ...props }: React.ComponentProps<typeof ComboboxPrimitive.Value>) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Trigger>) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "flex h-8 w-fit items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:bg-input/30 dark:hover:bg-input/50",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.Icon>
        <ChevronDownIcon className="size-4 opacity-50" />
      </ComboboxPrimitive.Icon>
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxContent({
  className,
  children,
  emptyMessage,
  searchPlaceholder,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Popup> & {
  emptyMessage?: string
  searchPlaceholder?: string
}) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={4} className="z-[100]">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "relative z-[100] flex max-h-(--available-height) w-(--anchor-width) min-w-48 origin-(--transform-origin) flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md",
            className
          )}
          {...props}
        >
          <div className="border-b border-border p-1.5">
            <ComboboxPrimitive.InputGroup className="relative flex items-center">
              <SearchIcon className="pointer-events-none absolute left-2 size-3.5 shrink-0 text-muted-foreground" />
              <ComboboxPrimitive.Input
                data-slot="combobox-input"
                placeholder={searchPlaceholder}
                className="h-7 w-full rounded-md bg-transparent pr-2 pl-7 text-sm outline-none placeholder:text-muted-foreground"
              />
            </ComboboxPrimitive.InputGroup>
          </div>
          <ComboboxPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground empty:m-0 empty:p-0">
            {emptyMessage}
          </ComboboxPrimitive.Empty>
          <ComboboxPrimitive.List className="max-h-64 overflow-x-hidden overflow-y-auto p-1">
            {children}
          </ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Item>) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ComboboxPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ComboboxPrimitive.ItemIndicator>
      </span>
      {children}
    </ComboboxPrimitive.Item>
  )
}

export { Combobox, ComboboxValue, ComboboxTrigger, ComboboxContent, ComboboxItem }

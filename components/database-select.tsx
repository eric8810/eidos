"use client"

import * as React from "react"
import { SimpleBackUp } from "@/worker/backup"
import { Check, ChevronsUpDown, Download, PlusCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useGoto } from "@/hooks/use-goto"
import { useSpace } from "@/hooks/use-space"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useConfigStore } from "@/app/settings/store"

import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface IDatabaseSelectorProps {
  databases: string[]
  defaultValue?: string
}

export function DatabaseSelect({
  databases,
  defaultValue,
}: IDatabaseSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue ?? "")
  const [searchValue, setSearchValue] = React.useState("")
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [databaseName, setDatabaseName] = React.useState("")
  const goto = useGoto()
  const router = useNavigate()
  const { createSpace } = useSpace()
  const [loading, setLoading] = React.useState(false)
  const { updateSpaceList } = useSpace()
  const [shouldCreateFromBackup, setShouldCreateFromBackup] =
    React.useState(false)

  const { backupServer } = useConfigStore()
  const hasBackupServer = backupServer.token && backupServer.url

  const handleGoSpaceManagement = () => {
    router("/space-manage")
  }

  const handleSelect = (currentValue: string) => {
    setValue(currentValue === value ? "" : currentValue)
    setOpen(false)
    goto(currentValue)
  }

  const handleCreateDatabase = async () => {
    if (databaseName) {
      setLoading(true)
      if (hasBackupServer && shouldCreateFromBackup) {
        const { token, url, autoSaveGap } = backupServer
        const backup = new SimpleBackUp(url, token, autoSaveGap)
        await backup.pull(databaseName, true)
      }
      createSpace(databaseName).then(() => {
        setLoading(false)
        setShowNewTeamDialog(false)
        setValue(databaseName)
        goto(databaseName)
      })
      updateSpaceList()
    }
  }

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full min-w-[180px] justify-between"
          >
            {value
              ? databases.find((db) => db === value)
              : "Select Database..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[180px] p-0">
          <Command>
            <CommandList>
              <CommandInput
                placeholder="Search Database..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandEmpty>
                <div>No database found.</div>
              </CommandEmpty>
              <CommandGroup>
                {databases.map((database) => (
                  <CommandItem key={database} onSelect={handleSelect}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === database ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {database}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewTeamDialog(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" /> Create New
                  </CommandItem>
                </DialogTrigger>
                <CommandItem onSelect={handleGoSpaceManagement}>
                  <Download className="mr-2 h-5 w-5" /> Import/Export
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Space</DialogTitle>
          <DialogDescription>
            Add a new space to manage data for you
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="database-name">Space name</Label>
              <Input
                id="database-name"
                placeholder="e.g. personal"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-4 py-2 pb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="shouldCreateFromBackup"
                checked={shouldCreateFromBackup}
                disabled={!hasBackupServer}
                onCheckedChange={() =>
                  setShouldCreateFromBackup(!shouldCreateFromBackup)
                }
              />
              <Label htmlFor="shouldCreateFromBackup">Create from backup</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button
            type="submit"
            onClick={handleCreateDatabase}
            disabled={loading}
          >
            {loading ? "Creating" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

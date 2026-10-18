import { Cpu, Layers, Moon, PawPrint, Skull, Swords, WandSparkles } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutomaticTab } from '@/components/automatic/automatic-tab'
import { CardsTab } from '@/components/cards/cards-tab'
import { CheffeniaTab } from '@/components/cheffenia/cheffenia-tab'
import { ClassEnchantsTab } from '@/components/class-enchants/class-enchants-tab'
import { EquipsTab } from '@/components/equips/equips-tab'
import { GrayWolfTab } from '@/components/gray-wolf/gray-wolf-tab'

function App() {
  return (
    <div className="relative min-h-dvh">
      {/* brilho de "luar" no topo da página */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,oklch(0.8_0.1_285/0.14),transparent)]"
      />

      <header className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 pt-8 pb-6 sm:px-6">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <Moon className="size-5 fill-current" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">MoonDB</h1>
          <p className="text-sm text-muted-foreground">Database do Moonlight</p>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Tabs defaultValue="cards" className="gap-6">
          <TabsList variant="line" className="h-10 w-full justify-start overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]">
            <TabsTrigger value="cards" className="flex-none px-3 text-sm">
              <Layers />
              Cartas
            </TabsTrigger>
            <TabsTrigger value="equips" className="flex-none px-3 text-sm">
              <Swords />
              Equipamentos
            </TabsTrigger>
            <TabsTrigger value="class-enchants" className="flex-none px-3 text-sm">
              <WandSparkles />
              Encantamentos Classe
            </TabsTrigger>
            <TabsTrigger value="automatic" className="flex-none px-3 text-sm">
              <Cpu />
              Automatic Armor
            </TabsTrigger>
            <TabsTrigger value="gray-wolf" className="flex-none px-3 text-sm">
              <PawPrint />
              Gray Wolf
            </TabsTrigger>
            <TabsTrigger value="cheffenia" className="flex-none px-3 text-sm">
              <Skull />
              Cheffenia
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cards">
            <CardsTab />
          </TabsContent>
          <TabsContent value="equips">
            <EquipsTab />
          </TabsContent>
          <TabsContent value="class-enchants">
            <ClassEnchantsTab />
          </TabsContent>
          <TabsContent value="automatic">
            <AutomaticTab />
          </TabsContent>
          <TabsContent value="gray-wolf">
            <GrayWolfTab />
          </TabsContent>
          <TabsContent value="cheffenia">
            <CheffeniaTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App

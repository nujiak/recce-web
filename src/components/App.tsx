import { type Component, Show, createSignal, createEffect } from 'solid-js';
import { uiStore } from '@/stores/ui';
import { preferences } from '@/stores/preferences';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { SavedList } from '@/components/saved/SavedList';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { GpsPanel } from '@/components/tools/GpsPanel';
import { RulerPanel } from '@/components/tools/RulerPanel';
import { SettingsPanel } from '@/components/tools/SettingsPanel';
import { PinEditor } from '@/components/pins/PinEditor';
import { PinInfo } from '@/components/pins/PinInfo';
import { TrackEditor } from '@/components/tracks/TrackEditor';
import { TrackInfo } from '@/components/tracks/TrackInfo';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import type { Pin, Track } from '@/types';

export const App: Component = () => {
  const [showOnboarding, setShowOnboarding] = createSignal(!preferences.onboardingDone());
  const [activePanel, setActivePanel] = createSignal<'gps' | 'ruler' | 'settings' | null>(null);

  const [pinEditorOpen, setPinEditorOpen] = createSignal(false);
  const [pinEditorMode, setPinEditorMode] = createSignal<'create' | 'edit'>('create');
  const [editingPin, setEditingPin] = createSignal<Pin | undefined>(undefined);
  const [pinEditorCoords, setPinEditorCoords] = createSignal({ lat: 0, lng: 0 });

  const [pinInfoOpen, setPinInfoOpen] = createSignal(false);
  const [pinInfoPin, setPinInfoPin] = createSignal<Pin | undefined>(undefined);

  const [trackEditorOpen, setTrackEditorOpen] = createSignal(false);
  const [trackEditorMode, setTrackEditorMode] = createSignal<'create' | 'edit'>('create');
  const [editingTrack, setEditingTrack] = createSignal<Track | undefined>(undefined);

  const [trackInfoOpen, setTrackInfoOpen] = createSignal(false);
  const [trackInfoTrack, setTrackInfoTrack] = createSignal<Track | undefined>(undefined);

  createEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme());
  });

  createEffect(() => {
    window.addEventListener('pinCardClicked', ((e: CustomEvent) => {
      setPinInfoPin(e.detail.pin);
      setPinInfoOpen(true);
    }) as EventListener);

    window.addEventListener('trackCardClicked', ((e: CustomEvent) => {
      setTrackInfoTrack(e.detail.track);
      setTrackInfoOpen(true);
    }) as EventListener);

    window.addEventListener('flyToPin', ((e: CustomEvent) => {
      console.log('Fly to pin:', e.detail);
    }) as EventListener);

    window.addEventListener('flyToTrack', ((e: CustomEvent) => {
      console.log('Fly to track:', e.detail);
    }) as EventListener);
  });

  const handleOpenTool = (tool: 'gps' | 'ruler' | 'settings') => {
    setActivePanel((prev) => (prev === tool ? null : tool));
  };

  const closeToolPanel = () => setActivePanel(null);

  const handlePinInfoEdit = (pin: Pin) => {
    setPinInfoOpen(false);
    setEditingPin(pin);
    setPinEditorMode('edit');
    setPinEditorCoords({ lat: pin.lat, lng: pin.lng });
    setPinEditorOpen(true);
  };

  const handleTrackInfoEdit = (track: Track) => {
    setTrackInfoOpen(false);
    setEditingTrack(track);
    setTrackEditorMode('edit');
    setTrackEditorOpen(true);
  };

  return (
    <>
      <Show when={showOnboarding()}>
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </Show>

      <Show when={!showOnboarding()}>
        <Show
          when={!uiStore.isMobile()}
          fallback={
            <div class="flex flex-col h-screen bg-surface">
              <main class="flex-1 relative overflow-hidden">
                <Show when={uiStore.screen() === 'map'}>
                  <div class="absolute inset-0 bg-surface-hover flex items-center justify-center">
                    <span class="material-symbols-outlined text-6xl text-secondary">map</span>
                  </div>
                </Show>

                <Show when={uiStore.screen() === 'saved'}>
                  <SavedList />
                </Show>

                <Show when={activePanel()}>
                  <div class="absolute inset-x-0 bottom-0 bg-surface border-t border-border rounded-t-2xl max-h-[70vh] overflow-auto z-10">
                    <div class="p-4">
                      <Show when={activePanel() === 'gps'}>
                        <GpsPanel />
                      </Show>
                      <Show when={activePanel() === 'ruler'}>
                        <RulerPanel />
                      </Show>
                      <Show when={activePanel() === 'settings'}>
                        <SettingsPanel />
                      </Show>
                    </div>
                    <button
                      class="absolute top-2 right-2 p-2 rounded-full hover:bg-surface-hover"
                      onClick={closeToolPanel}
                    >
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </Show>

                <Show when={uiStore.screen() === 'tools' && !activePanel()}>
                  <div class="p-4">
                    <ToolGrid onSelectTool={handleOpenTool} />
                  </div>
                </Show>
              </main>

              <BottomNav />
            </div>
          }
        >
          <DesktopLayout />
        </Show>
      </Show>

      <PinEditor
        open={pinEditorOpen()}
        onClose={() => setPinEditorOpen(false)}
        mode={pinEditorMode()}
        pin={editingPin()}
        lat={pinEditorCoords().lat}
        lng={pinEditorCoords().lng}
      />

      <PinInfo
        open={pinInfoOpen()}
        onClose={() => setPinInfoOpen(false)}
        pin={pinInfoPin()}
        onEdit={handlePinInfoEdit}
      />

      <TrackEditor
        open={trackEditorOpen()}
        onClose={() => setTrackEditorOpen(false)}
        mode={trackEditorMode()}
        track={editingTrack()}
      />

      <TrackInfo
        open={trackInfoOpen()}
        onClose={() => setTrackInfoOpen(false)}
        track={trackInfoTrack()}
        onEdit={handleTrackInfoEdit}
      />
    </>
  );
};

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Settings } from './types'

interface SiteTitleSettingsProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export function SiteTitleSettings({ settings, onSettingsChange }: SiteTitleSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Site Title Display</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the large title text shown on your homepage when logged out
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="siteTitleEnabled">Show Site Title</Label>
          <p className="text-sm text-muted-foreground">
            Display the site title when logged out
          </p>
        </div>
        <Switch
          id="siteTitleEnabled"
          checked={settings.siteTitleEnabled}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, siteTitleEnabled: checked })
          }
        />
      </div>

      {settings.siteTitleEnabled && (
        <>
          {/* Site Title Text */}
          <div className="space-y-2">
            <Label htmlFor="siteTitle">Site Title</Label>
            <Input
              id="siteTitle"
              value={settings.siteTitle}
              onChange={(e) =>
                onSettingsChange({ ...settings, siteTitle: e.target.value })
              }
              placeholder="Faux|Dash"
            />
            <p className="text-sm text-muted-foreground">
              The text to display (default: Faux|Dash)
            </p>
          </div>

          {/* Use Gradient Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="siteTitleUseGradient">Use Gradient</Label>
              <p className="text-sm text-muted-foreground">
                Apply a gradient effect to the title text
              </p>
            </div>
            <Switch
              id="siteTitleUseGradient"
              checked={settings.siteTitleUseGradient}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, siteTitleUseGradient: checked })
              }
            />
          </div>

          {settings.siteTitleUseGradient ? (
            <>
              {/* Gradient From Color */}
              <div className="space-y-2">
                <Label htmlFor="siteTitleGradientFrom">Gradient Start Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="siteTitleGradientFrom"
                    value={settings.siteTitleGradientFrom}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, siteTitleGradientFrom: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={settings.siteTitleGradientFrom}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, siteTitleGradientFrom: e.target.value })
                    }
                    placeholder="#0f172a"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Starting color for the gradient (left side)
                </p>
              </div>

              {/* Gradient To Color */}
              <div className="space-y-2">
                <Label htmlFor="siteTitleGradientTo">Gradient End Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="siteTitleGradientTo"
                    value={settings.siteTitleGradientTo}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, siteTitleGradientTo: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={settings.siteTitleGradientTo}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, siteTitleGradientTo: e.target.value })
                    }
                    placeholder="#475569"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ending color for the gradient (right side)
                </p>
              </div>
            </>
          ) : (
            /* Solid Color */
            <div className="space-y-2">
              <Label htmlFor="siteTitleColor">Title Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="siteTitleColor"
                  value={settings.siteTitleColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, siteTitleColor: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={settings.siteTitleColor}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, siteTitleColor: e.target.value })
                  }
                  placeholder="#0f172a"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Solid color for the title text
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-8 bg-muted rounded-lg flex items-center justify-center">
              <h1
                className="text-6xl font-bold"
                style={
                  settings.siteTitleUseGradient
                    ? {
                        background: `linear-gradient(to right, ${settings.siteTitleGradientFrom}, ${settings.siteTitleGradientTo})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }
                    : {
                        color: settings.siteTitleColor,
                      }
                }
              >
                {settings.siteTitle}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Preview of how your title will appear on the homepage
            </p>
          </div>
        </>
      )}
    </div>
  )
}

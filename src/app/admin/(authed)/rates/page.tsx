import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { updateRate, updateExtensionRate, updateSettings } from '@/lib/admin/actions'
import { peso } from '@/lib/content'

export const metadata: Metadata = { title: 'Rates', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PACKAGES = [
  { key: 'DAY_TOUR', label: 'Day tour', window: '07:00 → 17:00' },
  { key: 'NIGHT_TOUR', label: 'Night tour', window: '20:00 → 06:00' },
  { key: 'FULL_STAY', label: 'Full stay', window: '14:00 → 12:00' },
]

export default async function RatesPage() {
  const [units, settings] = await Promise.all([
    db.unit.findMany({ include: { ratePlans: true }, orderBy: { sortOrder: 'asc' } }),
    getSettings(),
  ])

  async function saveRate(formData: FormData) {
    'use server'
    await updateRate(
      String(formData.get('unitId')),
      String(formData.get('package')),
      Number(formData.get('price')),
    )
  }

  async function saveExtension(formData: FormData) {
    'use server'
    await updateExtensionRate(String(formData.get('unitId')), Number(formData.get('perHour')))
  }

  async function saveExtraGuest(formData: FormData) {
    'use server'
    await updateSettings({ extraGuestFee: Number(formData.get('extraGuestFee')) })
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-title font-display">Rates</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone">
        Every price covers up to 10 guests. Above that, each guest aged four and up adds the extra
        guest fee. Changes show on the site straight away.
      </p>

      {units.map((unit) => (
        <section key={unit.id} className="mt-10">
          <h2 className={`font-display text-lg ${unit.id === 'casita' ? 'text-pool' : 'text-brick'}`}>
            {unit.name}
          </h2>

          <div className="mt-4 space-y-3">
            {PACKAGES.map((pkg) => {
              const plan = unit.ratePlans.find((p) => p.package === pkg.key)
              return (
                <form
                  key={pkg.key}
                  action={saveRate}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-night-edge bg-night-raised px-5 py-4"
                >
                  <input type="hidden" name="unitId" value={unit.id} />
                  <input type="hidden" name="package" value={pkg.key} />

                  <div className="min-w-[9rem]">
                    <p className="text-sm text-paper">{pkg.label}</p>
                    <p className="font-data text-xs text-stone">{pkg.window}</p>
                  </div>

                  <label className="flex items-center gap-2">
                    <span className="font-data text-sm text-stone">₱</span>
                    <input
                      type="number"
                      name="price"
                      min={0}
                      step={50}
                      defaultValue={plan?.price ?? 0}
                      className="w-32 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-sm text-paper"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-full border border-stone/40 px-5 py-2 text-sm text-paper hover:border-stone"
                  >
                    Save
                  </button>
                </form>
              )
            })}

            <form
              action={saveExtension}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-night-edge bg-night-raised px-5 py-4"
            >
              <input type="hidden" name="unitId" value={unit.id} />
              <div className="min-w-[9rem]">
                <p className="text-sm text-paper">Extra hour</p>
                <p className="text-xs text-stone">Only offered when nobody follows</p>
              </div>
              <label className="flex items-center gap-2">
                <span className="font-data text-sm text-stone">₱</span>
                <input
                  type="number"
                  name="perHour"
                  min={0}
                  step={50}
                  defaultValue={unit.extensionRate}
                  className="w-32 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-sm text-paper"
                />
              </label>
              <button
                type="submit"
                className="rounded-full border border-stone/40 px-5 py-2 text-sm text-paper hover:border-stone"
              >
                Save
              </button>
            </form>
          </div>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="font-display text-lg">Applies to both units</h2>
        <form
          action={saveExtraGuest}
          className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-night-edge bg-night-raised px-5 py-4"
        >
          <div className="min-w-[9rem]">
            <p className="text-sm text-paper">Extra guest</p>
            <p className="text-xs text-stone">Per head past the first 10, age 4 and up</p>
          </div>
          <label className="flex items-center gap-2">
            <span className="font-data text-sm text-stone">₱</span>
            <input
              type="number"
              name="extraGuestFee"
              min={0}
              step={50}
              defaultValue={settings.extraGuestFee}
              className="w-32 rounded-lg border border-night-edge bg-night px-3 py-2 font-data text-sm text-paper"
            />
          </label>
          <button
            type="submit"
            className="rounded-full border border-stone/40 px-5 py-2 text-sm text-paper hover:border-stone"
          >
            Save
          </button>
        </form>
      </section>

      <section className="mt-12 rounded-2xl border border-night-edge bg-night-raised p-6">
        <h2 className="font-display text-base">Weekend and holiday rates</h2>
        <p className="mt-2 text-sm text-stone">
          Nothing set up yet — every date uses the prices above. When you want a different Holy Week
          or Christmas price, this is where it will go.
        </p>
        <p className="mt-3 font-data text-xs text-stone">
          Example: a full stay at the Casita is {peso(units[0]?.ratePlans.find((p) => p.package === 'FULL_STAY')?.price ?? 0)} every day of the year right now.
        </p>
      </section>
    </div>
  )
}

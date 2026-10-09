import { useState, useMemo } from 'react';
import { Association, CommitteeMember } from '../types';
import { useData } from '../context/DataContext';
import { OfflineSyncStatusBadge } from '../components/OfflineSyncStatusBadge';
import { Building2, Users, Phone, MapPin, Search, Mail, Send, Award, School as SchoolIcon } from 'lucide-react';

export default function Associations() {
  const { associations, loading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTownship, setSelectedTownship] = useState<string>('all');

  // Extract unique townships for filtering
  const townships = useMemo(() => {
    const set = new Set<string>();
    associations.forEach(a => {
      if (a.township && a.township.trim()) {
        set.add(a.township.trim());
      }
    });
    return Array.from(set);
  }, [associations]);

  const filteredAssociations = useMemo(() => {
    return associations.filter(a => {
      const matchTownship = selectedTownship === 'all' || a.township === selectedTownship;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.township && a.township.toLowerCase().includes(q)) ||
        (a.members && a.members.some(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)));

      return matchTownship && matchSearch;
    });
  }, [associations, selectedTownship, searchQuery]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-3xl font-extrabold text-sky-950 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-sky-600" />
          အသင်းများနှင့် အမှုဆောင်အဖွဲ့ဝင်များ <span className="text-lg font-normal text-slate-500">(Associations & EC Members)</span>
        </h2>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          ရှမ်းပြည်နယ် (တောင်ပိုင်း) ကိုယ်ပိုင်ကျောင်းများအသင်း ဗဟိုနှင့် မြို့နယ်အသင်းများ၏ အမှုဆောင်အဖွဲ့ဝင်များ အချက်အလက်
        </p>
      </div>

      {/* Search & Township Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="အသင်းအမည်၊ မြို့နယ် (သို့) အမှုဆောင်အဖွဲ့ဝင် အမည်ဖြင့် ရှာရန်..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden text-sm sm:text-base"
          />
        </div>

        {townships.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 mr-1">မြို့နယ်အလိုက်:</span>
            <button
              onClick={() => setSelectedTownship('all')}
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                selectedTownship === 'all'
                  ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              အားလုံး
            </button>
            {townships.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTownship(t)}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  selectedTownship === t
                    ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Associations List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="h-7 bg-slate-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="h-20 bg-slate-100 rounded-xl"></div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssociations.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-semibold text-lg">ဒေတာ မရှိသေးပါ (No associations found)</p>
          <p className="text-slate-400 text-sm">
            {searchQuery || selectedTownship !== 'all'
              ? 'ရှာဖွေမှုနှင့် ကိုက်ညီသော အသင်း သို့မဟုတ် အမှုဆောင် မတွေ့ရှိပါ။'
              : 'လက်ရှိအချိန်တွင် အသင်းများနှင့် အမှုဆောင်အဖွဲ့ဝင်များ ထည့်သွင်းထားခြင်း မရှိသေးပါ။'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredAssociations.map(assoc => (
            <article
              key={assoc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-sky-300"
            >
              {/* Association Banner / Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-sky-50/70 to-slate-50 border-b border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    {assoc.logoUrl ? (
                      <img
                        src={assoc.logoUrl}
                        alt={assoc.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 bg-white p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-sky-950 break-words">{assoc.name}</h3>
                        {assoc.township && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                            {assoc.township}
                          </span>
                        )}
                      </div>
                      {assoc.description && (
                        <p className="text-sm text-slate-600 break-words">{assoc.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Association Contacts */}
                  <div className="space-y-1.5 text-xs text-slate-600 sm:text-right shrink-0 max-w-full overflow-hidden">
                    {assoc.phone && (
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <a href={`tel:${assoc.phone}`} className="hover:text-sky-800 font-medium break-all">
                          {assoc.phone}
                        </a>
                      </div>
                    )}
                    {assoc.email && (
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <a href={`mailto:${assoc.email}`} className="hover:text-sky-800 break-all">
                          {assoc.email}
                        </a>
                      </div>
                    )}
                    {assoc.address && (
                      <div className="flex items-center sm:justify-end gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="break-words">{assoc.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Executive Committee Members Section */}
              <div className="p-5 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg border-b border-slate-100 pb-3">
                  <Award className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="break-words">အမှုဆောင်အဖွဲ့ဝင်များ (Executive Committee)</span>
                  <span className="text-xs font-normal text-slate-400 shrink-0 ml-1">
                    ({assoc.members ? assoc.members.length : 0} ဦး)
                  </span>
                </div>

                {!assoc.members || assoc.members.length === 0 ? (
                  <p className="text-slate-400 text-sm italic py-2">
                    အမှုဆောင်အဖွဲ့ဝင် စာရင်း ထည့်သွင်းထားခြင်း မရှိသေးပါ။
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {assoc.members.map((member: CommitteeMember, mIdx: number) => (
                      <div
                        key={mIdx}
                        className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 hover:border-sky-300 hover:bg-white transition space-y-2.5 min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {member.role || 'အဖွဲ့ဝင်'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base mt-1.5 break-words">
                              {member.name}
                            </h4>
                          </div>
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {member.school && (
                          <p className="text-xs text-slate-700 flex items-start gap-1.5 min-w-0 font-medium">
                            <SchoolIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="break-words leading-snug">{member.school}</span>
                          </p>
                        )}

                        {member.phone && (
                          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-200/60 min-w-0 gap-2">
                            <a
                              href={`tel:${member.phone}`}
                              className="text-sky-700 font-semibold hover:underline inline-flex items-center gap-1 truncate"
                            >
                              <Phone className="w-3 h-3 shrink-0" /> {member.phone}
                            </a>
                            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                              {member.viber && (
                                <a
                                  href={`viber://chat?number=${member.viber.replace(/[^0-9]/g, '')}`}
                                  className="text-purple-600 hover:text-purple-800 font-bold"
                                  title={`Viber: ${member.viber}`}
                                >
                                  V
                                </a>
                              )}
                              {member.telegram && (
                                <a
                                  href={`https://t.me/${member.telegram.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-500 hover:text-sky-700"
                                  title={`Telegram: ${member.telegram}`}
                                >
                                  <Send className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react'
import {
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Building,
  Globe,
  ArrowRight,
  Sparkles,
  Target,
  UserCheck,
  UserX
} from 'lucide-react'

// API Functions
const searchCompanies = async (query) => {
  const response = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&page=1&per_page=10`
  )
  if (!response.ok) throw new Error('Failed to search companies')
  return response.json()
}

const checkPeppolRegistration = async (siren) => {
  try {
    // Try with SIREN (0002 scheme)
    const response = await fetch(
      `https://directory.peppol.eu/search/1.0/json?participant=iso6523-actorid-upis::0002:${siren}`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.matches && data.matches.length > 0) {
        return { registered: true, data: data.matches[0] }
      }
    }

    // Try with French scheme (0009 - SIRET)
    const response2 = await fetch(
      `https://directory.peppol.eu/search/1.0/json?participant=iso6523-actorid-upis::0009:${siren}`
    )
    if (response2.ok) {
      const data2 = await response2.json()
      if (data2.matches && data2.matches.length > 0) {
        return { registered: true, data: data2.matches[0] }
      }
    }

    return { registered: false, data: null }
  } catch (error) {
    console.error('PEPPOL check error:', error)
    return { registered: false, data: null, error: true }
  }
}

// Stats Component
const StatsBar = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4 mb-8">
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{stats.searched}</p>
          <p className="text-sm text-slate-500">Companies Searched</p>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <UserCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{stats.prospects}</p>
          <p className="text-sm text-slate-500">Prospects (No PA)</p>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <UserX className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{stats.hasPA}</p>
          <p className="text-sm text-slate-500">Already Has PA</p>
        </div>
      </div>
    </div>
  </div>
)

// Company Card Component
const CompanyCard = ({ company, peppolStatus, onCheckPeppol, isChecking }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const siege = company.siege || {}
  const address = [
    siege.numero_voie,
    siege.type_voie,
    siege.libelle_voie,
    siege.code_postal,
    siege.libelle_commune
  ].filter(Boolean).join(' ')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {company.nom_complet || company.nom_raison_sociale}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                <span>{address || 'Address not available'}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {peppolStatus && (
            <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
              peppolStatus.registered
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {peppolStatus.registered ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Has PA
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Prospect
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">SIREN</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono font-semibold text-slate-900">{company.siren}</p>
            <button
              onClick={() => copyToClipboard(company.siren)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">SIRET (Siege)</p>
          <p className="text-sm font-mono text-slate-700">{siege.siret || 'N/A'}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Created</p>
          <p className="text-sm text-slate-700">{formatDate(company.date_creation)}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Employees</p>
          <p className="text-sm text-slate-700">{company.tranche_effectif_salarie || 'N/A'}</p>
        </div>
      </div>

      {/* Activity */}
      {company.activite_principale && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Activity (NAF)</p>
            <p className="text-sm text-slate-700">
              <span className="font-mono text-slate-500">{company.activite_principale}</span>
              {company.section_activite_principale && (
                <span className="ml-2">- {company.section_activite_principale}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* PEPPOL Status Details */}
      {peppolStatus?.registered && peppolStatus.data && (
        <div className="px-6 pb-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-red-600" />
              <p className="text-sm font-semibold text-red-700">PEPPOL Registration Found</p>
            </div>
            <p className="text-xs text-red-600">
              This company is already registered in the PEPPOL network and likely has a PA/PDP.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-3">
        {!peppolStatus && (
          <button
            onClick={() => onCheckPeppol(company.siren)}
            disabled={isChecking}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking PEPPOL...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Check PA Status
              </>
            )}
          </button>
        )}

        {peppolStatus && !peppolStatus.registered && (
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm">
            <Target className="w-4 h-4" />
            Add to CRM
          </button>
        )}

        <a
          href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${company.siren}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Details
        </a>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [peppolStatuses, setPeppolStatuses] = useState({})
  const [checkingPeppol, setCheckingPeppol] = useState({})
  const [stats, setStats] = useState({ searched: 0, prospects: 0, hasPA: 0 })
  const searchRef = useRef(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])
    setPeppolStatuses({})

    try {
      const data = await searchCompanies(query)
      setResults(data.results || [])
      setStats(prev => ({ ...prev, searched: prev.searched + (data.results?.length || 0) }))
    } catch (err) {
      setError('Failed to search companies. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckPeppol = async (siren) => {
    setCheckingPeppol(prev => ({ ...prev, [siren]: true }))

    try {
      const result = await checkPeppolRegistration(siren)
      setPeppolStatuses(prev => ({ ...prev, [siren]: result }))

      // Update stats
      if (result.registered) {
        setStats(prev => ({ ...prev, hasPA: prev.hasPA + 1 }))
      } else {
        setStats(prev => ({ ...prev, prospects: prev.prospects + 1 }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCheckingPeppol(prev => ({ ...prev, [siren]: false }))
    }
  }

  const checkAllCompanies = async () => {
    for (const company of results) {
      if (!peppolStatuses[company.siren]) {
        await handleCheckPeppol(company.siren)
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">SDR Lookup Portal</h1>
                <p className="text-sm text-slate-500">Find prospects without a PA/PDP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                France E-Invoicing
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Search Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-sm font-medium text-blue-700 mb-6">
            <Sparkles className="w-4 h-4" />
            Search French companies & check PA registration
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Prospect</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Enter a company name to search the French business registry, then check if they already have a PA registered in PEPPOL.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter company name (e.g., Carrefour, Total, BNP...)"
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Search
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Found {results.length} companies
              </h3>
              <button
                onClick={checkAllCompanies}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Check All PA Status
              </button>
            </div>

            <div className="grid gap-6">
              {results.map((company) => (
                <CompanyCard
                  key={company.siren}
                  company={company}
                  peppolStatus={peppolStatuses[company.siren]}
                  onCheckPeppol={handleCheckPeppol}
                  isChecking={checkingPeppol[company.siren]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies found</h3>
            <p className="text-slate-500">Try a different search term</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && results.length === 0 && !query && (
          <div className="text-center py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">1. Search Company</h4>
                <p className="text-sm text-slate-500">Enter a company name to search the French business registry</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Globe className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">2. Check PA Status</h4>
                <p className="text-sm text-slate-500">Verify if the company is registered in PEPPOL network</p>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">3. Target Prospects</h4>
                <p className="text-sm text-slate-500">Focus on companies without a PA for your outreach</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>ClearTax SDR Lookup Portal - France E-Invoicing</p>
            <div className="flex items-center gap-4">
              <a href="https://recherche-entreprises.api.gouv.fr/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700">
                Data: INSEE/Sirene
              </a>
              <a href="https://directory.peppol.eu/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700">
                PEPPOL Directory
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

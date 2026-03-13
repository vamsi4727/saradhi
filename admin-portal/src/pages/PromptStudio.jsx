import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { adminApi } from '../services/adminApi';

const PROMPT_KEYS = [
  'onboarding_system',
  'recommendation_rationale',
  'copilot_system',
  'portfolio_insight',
  'risk_alert',
];

export default function PromptStudio() {
  const [prompts, setPrompts] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activePrompt, setActivePrompt] = useState(null);
  const [draft, setDraft] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    adminApi.get('/prompts').then(({ data }) => {
      setPrompts(data.prompts || []);
      if (!selectedKey && data.prompts?.length) {
        setSelectedKey(data.prompts[0].key);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    Promise.all([
      adminApi.get(`/prompts/${selectedKey}`),
      adminApi.get(`/prompts/${selectedKey}/active`).catch(() => ({ data: null })),
    ]).then(([versionsRes, activeRes]) => {
      setVersions(versionsRes.data?.versions || []);
      const active = activeRes.data;
      setActivePrompt(active);
      const latest = versionsRes.data?.versions?.[0];
      setDraft(active?.system_prompt || latest?.system_prompt || '');
    }).catch(() => {
      setVersions([]);
      setActivePrompt(null);
      setDraft('');
    }).finally(() => setLoading(false));
  }, [selectedKey]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await adminApi.post(`/prompts/${selectedKey}`, {
        system_prompt: draft,
        change_notes: changeNotes,
      });
      const { data } = await adminApi.get(`/prompts/${selectedKey}`);
      setVersions(data.versions || []);
      setChangeNotes('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (version) => {
    try {
      await adminApi.post(`/prompts/${selectedKey}/publish`, { version });
      const { data } = await adminApi.get(`/prompts/${selectedKey}`);
      setVersions(data.versions || []);
      const activeRes = await adminApi.get(`/prompts/${selectedKey}/active`);
      setActivePrompt(activeRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to publish');
    }
  };

  const handleRollback = async (v) => {
    try {
      await adminApi.post(`/prompts/${selectedKey}/rollback/${v}`);
      const { data } = await adminApi.get(`/prompts/${selectedKey}`);
      setVersions(data.versions || []);
      const activeRes = await adminApi.get(`/prompts/${selectedKey}/active`);
      setActivePrompt(activeRes.data);
      setDraft(activeRes.data?.system_prompt || '');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rollback');
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data } = await adminApi.post('/prompts/test', {
        system_prompt: draft,
        user_message: testMessage,
      });
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.response?.data?.error || 'Test failed' });
    } finally {
      setTestLoading(false);
    }
  };

  const activeVersion = activePrompt?.version;
  const displayKeys = prompts.length ? prompts : PROMPT_KEYS.map((k) => ({ key: k, active_version: null }));

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-48 shrink-0 flex flex-col gap-2">
        <h2 className="text-admin-muted text-xs font-medium uppercase mb-2">Prompts</h2>
        {displayKeys.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelectedKey(p.key)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedKey === p.key
                ? 'bg-admin-accent/20 text-admin-accent'
                : 'text-admin-muted hover:bg-admin-border/50 hover:text-gray-200'
            }`}
          >
            {p.key}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-admin-muted">Loading...</div>
        ) : selectedKey ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold font-mono">{selectedKey}</h1>
              {activeVersion && (
                <span className="text-admin-muted text-sm">Active: v{activeVersion}</span>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0 border border-admin-border rounded-xl overflow-hidden">
                <div className="bg-admin-surface px-4 py-2 border-b border-admin-border text-admin-muted text-sm">
                  System Prompt
                </div>
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={draft}
                  onChange={setDraft}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                  }}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Change notes (optional)"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  className="flex-1 px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm"
                />
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-admin-border/50 hover:bg-admin-border rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>

              <div className="border border-admin-border rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Test Panel</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Test message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                    className="flex-1 px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm"
                  />
                  <button
                    onClick={handleTest}
                    disabled={testLoading}
                    className="px-4 py-2 bg-admin-accent hover:bg-blue-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    {testLoading ? 'Running...' : 'Run Test'}
                  </button>
                </div>
                {testResult && (
                  <div className="mt-3 p-3 bg-admin-bg rounded-lg text-sm space-y-2">
                    {testResult.error ? (
                      <p className="text-admin-danger">{testResult.error}</p>
                    ) : (
                      <>
                        <p className="text-admin-muted whitespace-pre-wrap">{testResult.response}</p>
                        <p className="font-mono text-xs text-admin-muted">
                          {testResult.input_tokens} in / {testResult.output_tokens} out · ₹{testResult.cost_inr?.toFixed(4)}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="border border-admin-border rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Version History</h3>
                <div className="space-y-2">
                  {versions.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-2 border-b border-admin-border/50 last:border-0"
                    >
                      <span className="font-mono text-sm">
                        v{v.version}
                        {v.is_active && ' (Active)'}
                      </span>
                      <div className="flex gap-2">
                        {!v.is_active && !v.is_draft && (
                          <button
                            onClick={() => handleRollback(v.version)}
                            className="text-xs text-admin-accent hover:underline"
                          >
                            Rollback
                          </button>
                        )}
                        {!v.is_active && v.is_draft && (
                          <button
                            onClick={() => handlePublish(v.version)}
                            className="text-xs text-green-400 hover:underline"
                          >
                            Publish
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-admin-muted text-sm">No versions yet. Save a draft to create one.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-admin-muted">
            Select a prompt to edit
          </div>
        )}
      </div>
    </div>
  );
}

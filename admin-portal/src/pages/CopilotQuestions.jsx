import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { MessageSquareQuestion } from 'lucide-react';

export default function CopilotQuestions() {
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get('/copilot-questions').then(({ data }) => {
      setQuestions(data.questions || []);
    }).catch(() => setQuestions([])).finally(() => setLoading(false));
  }, []);

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditQuestion(q.question);
    setEditAnswer(q.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await adminApi.put(`/copilot-questions/${editingId}`, {
        question: editQuestion,
        answer: editAnswer,
      });
      const { data } = await adminApi.get('/copilot-questions');
      setQuestions(data.questions || []);
      cancelEdit();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-admin-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquareQuestion className="w-6 h-6 text-admin-accent" />
        <h1 className="text-xl font-bold font-mono">Co-Pilot Quick Questions</h1>
      </div>
      <p className="text-admin-muted text-sm">
        These 5 questions appear as &quot;Try asking&quot; in the Co-Pilot. When a user selects one, they receive the stored answer instead of an AI response.
      </p>

      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="border border-admin-border rounded-xl p-4 bg-admin-surface/50"
          >
            {editingId === q.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-admin-muted text-xs mb-1">Question</label>
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm"
                    placeholder="Question text"
                  />
                </div>
                <div>
                  <label className="block text-admin-muted text-xs mb-1">Answer</label>
                  <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm resize-y"
                    placeholder="Answer shown when user selects this question"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-admin-accent hover:bg-blue-600 rounded-lg text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-admin-border/50 hover:bg-admin-border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium text-gray-200 mb-2">{q.question}</p>
                <p className="text-admin-muted text-sm whitespace-pre-wrap line-clamp-3 mb-3">
                  {q.answer}
                </p>
                <button
                  onClick={() => startEdit(q)}
                  className="text-admin-accent hover:underline text-sm"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <p className="text-admin-muted">No questions yet. Run the migration to seed the default 5.</p>
      )}
    </div>
  );
}

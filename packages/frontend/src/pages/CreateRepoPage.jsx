import React, { useState, useEffect } from 'react';

const CreateRepoPage = () => {
    const [orgs, setOrgs] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('default');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch orgs from new backend route
    useEffect(() => {
        async function fetchOrgs() {
            try {
                const res = await fetch('/api/orgs', { credentials: 'include' });
                const data = await res.json();
                setOrgs(data.orgs || []);
            } catch (e) {
                setOrgs([]);
            }
        }
        fetchOrgs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            const res = await fetch('/api/repositories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    org: selectedOrg,
                    name,
                    description,
                }),
            });
            if (!res.ok) throw new Error('Failed to create repository');
            setSuccess(true);
            setName('');
            setDescription('');
        } catch (e) {
            setError(e.message || 'Error creating repository');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Create New Repository</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Organization</label>
                    <select
                        value={selectedOrg}
                        onChange={e => setSelectedOrg(e.target.value)}
                        className="w-full border rounded p-2"
                    >
                        <option value="default">Default (Personal)</option>
                        {orgs.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Repository Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full border rounded p-2"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border rounded p-2"
                        rows={3}
                    />
                </div>
                {error && <div className="text-red-600 mb-2">{error}</div>}
                {success && <div className="text-green-600 mb-2">Repository created successfully!</div>}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Repository'}
                </button>
            </form>
        </div>
    );
};

export default CreateRepoPage;

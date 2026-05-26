import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../services/api";
import ReportResultModal from "../components/ReportResultModal";
import GroupRoundView from "../components/GroupRoundView";

export default function GroupDetails() {
  const { id } = useParams();

  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [me, setMe] = useState(null);

  const [selectedMatch, setSelectedMatch] = useState(null);

  async function load() {
    const [g, p, st, m, f, meResp] = await Promise.all([
      apiGet(`/groups/${id}`),
      apiGet(`/groups/${id}/players`),
      apiGet(`/groups/${id}/table`),
      apiGet(`/groups/${id}/matches`),
      apiGet(`/groups/${id}/fixtures`),
      apiGet("/profile/me").catch(() => null),
    ]);

    setGroup(g);
    setPlayers(p);
    setStandings(st);
    setMatches(m);
    setFixtures(f);
    setMe(meResp);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canReportFixture = (f) =>
    me && (f.player1.id === me.id || f.player2.id === me.id || me.is_admin);

  return (
    <>
      <GroupRoundView
        group={group}
        players={players}
        standings={standings}
        fixtures={fixtures}
        matches={matches}
        me={me}
        showHeader={true}
        backTo="/groups"
        backLabel="← Volver a grupos"
        canReportFixture={canReportFixture}
        onReportMatch={(fixture) => setSelectedMatch(fixture)}
      />

      {selectedMatch && (
        <ReportResultModal
          match={selectedMatch}
          me={me}
          onClose={() => setSelectedMatch(null)}
          onSuccess={load}
        />
      )}
    </>
  );
}

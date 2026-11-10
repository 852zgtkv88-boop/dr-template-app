export const categories = [
  { id: 'db', label: 'Datenbanken' },
  { id: 'web', label: 'Web- & Anwendungsserver' },
  { id: 'lb', label: 'Load Balancer & Networking' },
  { id: 'storage', label: 'Storage & Backup' },
  { id: 'virt', label: 'Virtualisierung & Cloud' },
  { id: 'mq', label: 'Messaging & Integration' },
  { id: 'iam', label: 'Identity & Verzeichnisdienste' },
  { id: 'ops', label: 'Monitoring & Betrieb' },
]

export const components = [
  // --- Datenbanken ---
  {
    id: 'sqlserver',
    category: 'db',
    name: 'Microsoft SQL Server',
    docs: 'https://learn.microsoft.com/sql/sql-server/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. SQL Server unterstützt Always On Availability Groups und Failover Cluster Instances mit automatischem Failover sowie Log-Shipping und Backup/Restore für einfachere Szenarien.',
      auswirkung: 'Bei einem Ausfall sind alle datenbankbasierten Anwendungen betroffen; Transaktionen werden abgewiesen, es droht Datenverlust im Umfang des letzten ungesicherten Transaktionsprotokolls.',
      methodik: 'Recovery über Availability Group mit automatischem Failover auf ein sekundäres Replikat; ohne AG manueller Restore aus Voll-, Diff- und Log-Backups.',
    },
    plan: {
      schritte: [
        'Prüfen, ob das sekundäre Replikat die primäre Rolle übernommen hat (automatisches Failover).',
        'Anwendungen auf den neuen aktiven Datenbankknoten umleiten lassen bzw. Verbindungswiederholungen bestätigen.',
        'Falls kein automatisches Failover: Restore-Koordination mit dem DBA-Team starten und Zeitschätzung einholen.',
        'Datenkonsistenz mit Fachbereich stichprobenartig prüfen und Kommunikation an die Nutzer freigeben.',
      ],
    },
  },
  {
    id: 'postgres',
    category: 'db',
    name: 'PostgreSQL',
    docs: 'https://www.postgresql.org/docs/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. PostgreSQL bietet Streaming-Replikation mit Warm/Hot Standby, synchroner Replikation für Null-Datenverlust sowie Point-in-Time-Recovery über WAL-Archive.',
      auswirkung: 'Ausfall blockiert alle lesenden und schreibenden Anwendungsfunktionen; ohne synchrones Standby geht der seit dem letzten WAL-Transport angefallene Datenbestand verloren.',
      methodik: 'Recovery per Promotion des Standby-Replikats (automatisierbar über Patroni/Repmgr) oder Point-in-Time-Recovery aus Basisbackup plus WAL-Archiv.',
    },
    plan: {
      schritte: [
        'Standby-Replikat zum primären Knoten hochstufen lassen (i. d. R. automatisiert).',
        'Verbindungs-Endpoint der Anwendungen auf den neuen primären Knoten bestätigen lassen.',
        'Bei Restore-Szenario: DBA-Zeitschätzung für Backup-Restore einholen und Stakeholder informieren.',
        'Nach Wiederanlauf: Transaktionskonsistenz prüfen und Regelbetrieb kommunizieren.',
      ],
    },
  },
  {
    id: 'mysql',
    category: 'db',
    name: 'MySQL / MariaDB',
    docs: 'https://dev.mysql.com/doc/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. MySQL/MariaDB unterstützen Replikation (asynchron/semi-synchron) und binlog-basierte Point-in-Time-Recovery; InnoDB erlaubt Crash-Recovery mit Transaktionsrollback.',
      auswirkung: 'Datenbankgestützte Prozesse stehen still; bei asynchroner Replikation ist mit Datenverlust bis zum zuletzt übertragenen Binlog-Ereignis zu rechnen.',
      methodik: 'Recovery durch Promotion eines Replikats oder Restore aus physischem/logischem Backup mit anschließendem Binlog-Replay.',
    },
    plan: {
      schritte: [
        'Replikat als neue primäre Instanz aktivieren lassen bzw. Restore-Auftrag starten.',
        'Anwendungsdienste neu verbinden und Funktionsfähigkeit anhand kritischer Transaktionen prüfen.',
        'Datenverlustumfang vom DBA bestätigen lassen und Fachbereich informieren.',
        'Replikationskette wieder aufbauen und Normalbetrieb melden.',
      ],
    },
  },
  {
    id: 'oracle',
    category: 'db',
    name: 'Oracle Database',
    docs: 'https://docs.oracle.com/en/database/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. Oracle Data Guard bietet automatischen Failover (Fast-Start Failover), RMAN ermöglicht Recovery mit Block-Level-Genauigkeit; optional Active Data Guard für synchrone Replikation.',
      auswirkung: 'Kritische Unternehmensprozesse sind vollständig blockiert; Lizenz- und Support-Prozesse erfordern eine zeitnahe Eskalation an Oracle Support.',
      methodik: 'Recovery über Data Guard Failover auf Standby-Datenbank; alternativ RMAN-Restore aus Backup mit Point-in-Time-Recovery.',
    },
    plan: {
      schritte: [
        'Data-Guard-Failover auf Standby-Datenbank bestätigen (automatisch oder DBA-getrieben).',
        'Anwendungen über TNS/Service-Neukonfiguration mit der neuen primären Datenbank verbinden.',
        'Bei Restore: RMAN-Laufzeit vom DBA-Team einholen und Business-Kommunikation abstimmen.',
        'Nach Stabilisierung: Standby neu aufbauen und Regelbetrieb verkünden.',
      ],
    },
  },
  {
    id: 'mongodb',
    category: 'db',
    name: 'MongoDB',
    docs: 'https://www.mongodb.com/docs/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. Replica Sets mit automatischer Wahl eines neuen Primärknotens (Raft-basiert); Write Concern steuert den Datenverlust bei Ausfall; Ops Manager/Atlas automatisieren Backups.',
      auswirkung: 'Schreibzugriffe pausieren während der Primärwahl (i. d. R. Sekunden); Lesezugriffe sind über Secondaries weiterhin eingeschränkt möglich.',
      methodik: 'Recovery per automatischem Replica-Set-Failover; bei Totalausfall Resync der Knoten oder Restore aus Ops-Manager-/Atlas-Backups.',
    },
    plan: {
      schritte: [
        'Automatische Primärwahl im Replica Set abwarten und bestätigen lassen.',
        'Anwendungsverbindungen auf den neuen Primärknoten prüfen.',
        'Bei Totalausfall: Backup-Restore beauftragen und Wiederanlaufzeit kommunizieren.',
        'Replica-Set-Integrität (alle Knoten gesund) herstellen lassen.',
      ],
    },
  },
  {
    id: 'awsrds',
    category: 'db',
    name: 'AWS RDS / Aurora',
    docs: 'https://docs.aws.amazon.com/rds/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. Multi-AZ-Deployment mit synchronem Standby in zweiter Availability Zone und automatischem Failover (typisch 60–120 s); Aurora nutzt Storage-Replikation über drei AZs.',
      auswirkung: 'Kurzzeitige Verbindungstimeouts während des Failovers; bei AZ-Ausfall bleibt die Datenbank über die Standby-Instanz nahezu unterbrechungsfrei verfügbar.',
      methodik: 'Recovery durch automatischen Failover des Multi-AZ-/Aurora-Setups; punktgenaue Wiederherstellung (Point-in-Time) aus automatischen Snapshots.',
    },
    plan: {
      schritte: [
        'AWS-Statusseite prüfen und Failover-Ereignis bestätigen lassen.',
        'Anwendungsteam Verbindungsabbrüche und Wiederanlauf bestätigen lassen.',
        'Bei regionalem Ausfall: Entscheidung für Cross-Region-Read-Replica-Promotion treffen.',
        'AWS-Support-Ticket bei unklarer Ursache eröffnen und Kommunikation an Stakeholder.',
      ],
    },
  },

  // --- Web- & Anwendungsserver ---
  {
    id: 'nginx',
    category: 'web',
    name: 'Nginx',
    docs: 'https://nginx.org/en/docs/',
    konzept: {
      faehigkeit: 'Mittlere bis hohe Recovery-Fähigkeit. Stateless Reverse Proxy; Recovery ist primär ein Neustart/Redeploy der Instanz; Ausfallsicherheit entsteht durch Mehrfach-Instanzen hinter Load Balancern.',
      auswirkung: 'Bei Einzelinstanz-Ausfall sind die zugehörigen Webdienste nicht erreichbar; bei redundantem Betrieb erfolgt keine spürbare Beeinträchtigung.',
      methodik: 'Recovery durch Neustart der Instanz bzw. erneutes Provisionieren (IaC) und automatisches Health-Check-basiertes Umleiten auf verbleibende Instanzen.',
    },
    plan: {
      schritte: [
        'Monitoring-Alarm zum ausgefallenen Webserver bestätigen.',
        'Traffic-Verteilung prüfen (verbleibende Instanzen übernehmen automatisch).',
        'Neue Instanz provisionieren bzw. Neustart veranlassen.',
        'Wiederhergestellten Knoten im Load Balancer aktiv bestätigen lassen.',
      ],
    },
  },
  {
    id: 'apache',
    category: 'web',
    name: 'Apache HTTP Server',
    docs: 'https://httpd.apache.org/docs/',
    konzept: {
      faehigkeit: 'Mittlere Recovery-Fähigkeit. Stateless Webserver; schnelle Wiederherstellung durch Neustart; Hochverfügbarkeit über mehrere Instanzen mit gemeinsamem Konfigurationsmanagement.',
      auswirkung: 'Webangebote hinter der ausgefallenen Instanz sind nicht erreichbar; redundante Instanzen kompensieren den Ausfall ohne Nutzermeldung.',
      methodik: 'Recovery durch Neustart bzw. Redeploy der Instanz; Load-Balancer-Health-Checks steuern das automatische Umleiten auf intakte Knoten.',
    },
    plan: {
      schritte: [
        'Alarm prüfen und betroffene Instanz identifizieren lassen.',
        'Verbleibende Webserver-Instanzen auf Lastverteilung bestätigen.',
        'Instanz neu starten bzw. neu ausrollen und Konfigurationsstand prüfen.',
        'Knoten wieder in Betrieb nehmen und Alarm schließen.',
      ],
    },
  },
  {
    id: 'iis',
    category: 'web',
    name: 'Microsoft IIS',
    docs: 'https://learn.microsoft.com/iis/',
    konzept: {
      faehigkeit: 'Mittlere bis hohe Recovery-Fähigkeit. IIS ist stateless; Konfiguration via Shared Configuration replizierbar; ARR (Application Request Routing) ermöglicht serverseitiges Lastausgleichs-Failover.',
      auswirkung: 'Hosted Websites und Web-APIs sind auf der ausgefallenen Instanz nicht erreichbar; mit Shared Configuration kann ein Ersatzknoten schnell übernehmen.',
      methodik: 'Recovery durch Neustart des IIS-Dienstes oder Provisionierung eines Ersatzknotens; Shared Configuration stellt Konsistenz sicher.',
    },
    plan: {
      schritte: [
        'Betroffenen Webserver im Monitoring identifizieren.',
        'Zweiten Knoten mit gleicher Konfiguration hochfahren bzw. bestätigen lassen.',
        'IIS-Dienst neu starten und Website-Erreichbarkeit stichproben prüfen.',
        'Normalbetrieb bestätigen und Incident-Dokumentation abschließen.',
      ],
    },
  },
  {
    id: 'tomcat',
    category: 'web',
    name: 'Apache Tomcat',
    docs: 'https://tomcat.apache.org/tomcat-11.0-doc/',
    konzept: {
      faehigkeit: 'Mittlere Recovery-Fähigkeit. Tomcat selbst ist stateless (außer In-Memory-Session-Replikation); Recovery ist überwiegend ein Redeploy der Anwendung auf einem Ersatzknoten.',
      auswirkung: 'Java-Anwendungen auf dem Knoten sind nicht erreichbar; persistente Sessions bleiben bei Session-Replikation bzw. externem Session-Store erhalten.',
      methodik: 'Recovery durch Neustart des Tomcat-Dienstes bzw. Deployment des WAR auf einem Ersatzknoten; Load Balancer erkennt den Knoten via Health-Check.',
    },
    plan: {
      schritte: [
        'Monitoring-Alarm dem betroffenen Application-Server zuordnen.',
        'Anwendung auf Ersatzknoten deployen bzw. Neustart veranlassen.',
        'Session-Datenverlust (falls In-Memory) mit Fachbereich abstimmen.',
        'Erreichbarkeit der Anwendung prüfen und Betrieb freigeben.',
      ],
    },
  },

  // --- Load Balancer & Networking ---
  {
    id: 'haproxy',
    category: 'lb',
    name: 'HAProxy',
    docs: 'https://www.haproxy.com/documentation/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit im Cluster-Betrieb (Keepalived/VRRP mit schwenkender Virtueller IP). Einzelner Ausfall bleibt unsichtbar; Konfiguration ist deklarativ und schnell reproduzierbar.',
      auswirkung: 'Bei Ausfall beider Knoten sind alle dahinterliegenden Dienste nicht erreichbar; einzelner Knotenausfall ist für Nutzer nicht wahrnehmbar.',
      methodik: 'Recovery per VRRP-automatischem Übernehmen der virtuellen IP durch den Standby-Knoten; Wiederherstellung des zweiten Knotens per Konfigurations-Redeploy.',
    },
    plan: {
      schritte: [
        'Prüfen, ob der verbleibende Load-Balancer-Knoten die virtuelle IP übernommen hat.',
        'Erreichbarkeit aller Dienste über die Standard-URLs stichprobenartig prüfen.',
        'Ausgefallenen Knoten neu provisionieren und in den Cluster aufnehmen lassen.',
        'Alarm zurücksetzen und Ausfallursache dokumentieren.',
      ],
    },
  },
  {
    id: 'f5',
    category: 'lb',
    name: 'F5 BIG-IP',
    docs: 'https://clouddocs.f5.com/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. Device-Cluster (Active/Standby) mit automatischem Konfigurationssync und Failover-Trigger; Konfiguration zusätzlich als UCS-Backup exportierbar.',
      auswirkung: 'Bei Cluster-Ausfall sind alle publizierten Anwendungen nicht erreichbar; einzelner Device-Ausfall wird durch den Standby kompensiert.',
      methodik: 'Recovery über automatisches Cluster-Failover; Ersatz-Device via UCS-Restore oder iControl-Automatisierung innerhalb Stunden wiederherstellbar.',
    },
    plan: {
      schritte: [
        'BIG-IP-Dashboard prüfen und Failover-Status des Clusters bestätigen.',
        'Kritische publizierte Anwendungen auf Erreichbarkeit testen lassen.',
        'Ersatz-Device beschaffen bzw. wiederherstellen und Cluster-Sync veranlassen.',
        'Failover-Ursache mit Netzwerkteam klären und dokumentieren.',
      ],
    },
  },
  {
    id: 'dns',
    category: 'lb',
    name: 'DNS (z. B. BIND, Route 53)',
    docs: 'https://docs.aws.amazon.com/route53/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. DNS ist redundant konzipiert (mehrere NS, sekundäre Zonen-Transfers); AWS Route 53 bietet integrierte Health Checks und Failover-Routing-Policies.',
      auswirkung: 'Bei DNS-Ausfall sind alle Anwendungen über Namen nicht erreichbar, obwohl Systeme selbst laufen; Nutzer und Services treffen auf Auflösefehler.',
      methodik: 'Recovery über sekundäre DNS-Server bzw. Route-53-Failover-Routing auf Ersatz-IPs; Restore der Zonen aus Konfigurationsbackup.',
    },
    plan: {
      schritte: [
        'DNS-Auflösung für kritische Domains testen lassen.',
        'Bei Cloud-DNS: Health-Check-Failover auf Ersatz-Target bestätigen.',
        'Bei eigenem DNS: sekundären Server priorisieren bzw. Zonen wiederherstellen.',
        'TTL-abhängige Propagation beachten und Nutzer über Verzögerung informieren.',
      ],
    },
  },

  // --- Storage & Backup ---
  {
    id: 'netapp',
    category: 'storage',
    name: 'NetApp ONTAP',
    docs: 'https://docs.netapp.com/us-en/ontap/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. MetroCluster/SnapMirror-Replikation zwischen Standorten, SnapRestore für sekundenschnelle Wiederherstellung von Snapshots.',
      auswirkung: 'Ausfall betrifft alle darauf gehosteten Datenmengen; Storage-bedingte I/O-Pausen wirken sich auf alle angeschlossenen Systeme aus.',
      methodik: 'Recovery per SnapMirror-Failover auf das Zielsystem bzw. SnapRestore aus lokalen Snapshots; automatisches Failover im MetroCluster-Verbund.',
    },
    plan: {
      schritte: [
        'Storage-Team über Replication-Status (SnapMirror) informieren lassen.',
        'Failover auf Replikationsziel veranlassen bzw. dessen Automatik bestätigen.',
        'Datenverfügbarkeit mit den Anwendungsteams abtesten.',
        'Quell-System instand setzen und Replikation wieder synchronisieren.',
      ],
    },
  },
  {
    id: 'veeam',
    category: 'storage',
    name: 'Veeam Backup & Replication',
    docs: 'https://helpcenter.veeam.com/',
    konzept: {
      faehigkeit: 'Zentrale Recovery-Sicherheitsinstanz. Veeam sichert VMs, physische Hosts und Cloud-Workloads; SureBackup validiert Backups; Replikation erlaubt nahtlosen VM-Neustart am Zielstandort.',
      auswirkung: 'Bei Ausfall des Backup-Servers ist die Wiederherstellungsfähigkeit eingeschränkt; bestehende Backups bleiben auf den Repositories erhalten.',
      methodik: 'Recovery des Backup-Servers über Configuration-Backup (konfiguriertes Restore); Workload-Recovery über VM-Replikation oder Granular Restore aus Backups.',
    },
    plan: {
      schritte: [
        'Configuration-Backup des Veeam-Servers prüfen und Restore beauftragen.',
        'Priorisierte Systemliste für Wiederherstellung freigeben (RTO-Reihenfolge).',
        'SureBackup-/Restore-Jobs überwachen und Zeitschätzungen einholen.',
        'Wiederhergestellte Systeme mit den Fachbereichen abnehmen.',
      ],
    },
  },
  {
    id: 's3',
    category: 'storage',
    name: 'AWS S3',
    docs: 'https://docs.aws.amazon.com/s3/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. S3 speichert Objekte redundant über mehrere Facilities innerhalb einer Region; Cross-Region-Replication und Versioning schützen vor regionalem Ausfall und versehentlichem Löschen.',
      auswirkung: 'Bei regionalem Ausfall sind Datenobjekte nicht abrufbar; Anwendungen mit S3-Abhängigkeit funktionieren eingeschränkt; ohne CRR bleibt nur der Restore nach Regionsheilung.',
      methodik: 'Recovery über Cross-Region-Replication bzw. Restore aus Versioning; bei Löschszenariern Wiederherstellung früherer Objektversionen.',
    },
    plan: {
      schritte: [
        'AWS-Statusseite prüfen und betroffene Region identifizieren.',
        'Bei CRR-Anbindung: Anwendungen auf Replikations-Bucket umstellen lassen.',
        'Bei Löschszenarien: Version-Wiederherstellung veranlassen.',
        'Wiederherstellung mit den Anwendungsteams testen und freigeben.',
      ],
    },
  },

  // --- Virtualisierung & Cloud ---
  {
    id: 'vmware',
    category: 'virt',
    name: 'VMware vSphere',
    docs: 'https://docs.vmware.com/en/VMware-vSphere/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. vSphere HA startet VMs nach Host-Ausfall automatisch auf verbleibenden Hosts neu; vMotion erlaubt geplante Entlastung; Site Recovery Manager orchestriert standortübergreifendes Failover.',
      auswirkung: 'Bei Host-Ausfall starten alle VMs des Hosts auf anderen Hosts neu (Boot-Zeit); bei vCenter-Ausfall laufen VMs weiter, Verwaltung ist eingeschränkt.',
      methodik: 'Recovery per vSphere-HA-Neustart der VMs; standortübergreifend automatisiertes Failover über SRM-Recovery-Pläne.',
    },
    plan: {
      schritte: [
        'vCenter-Alarm prüfen und betroffenen Host identifizieren lassen.',
        'VM-Neustarts auf Ersatzhosts überwachen (vSphere HA).',
        'Kritische Systeme priorisieren und Startreihenfolge bestätigen.',
        'Ausgefallenen Host instand setzen und Cluster wieder ausbalancieren.',
      ],
    },
  },
  {
    id: 'azure',
    category: 'virt',
    name: 'Microsoft Azure',
    docs: 'https://learn.microsoft.com/azure/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. Availability Sets/Zonen schützen vor Rechenzentrumsausfällen; Azure Site Recovery (ASR) repliziert VMs regionsübergreifend und automatisiert das Failover.',
      auswirkung: 'Bei Regionsausfall sind alle Ressourcen der Region nicht erreichbar; mit ASR ist ein Failover in die Sekundärregion innerhalb der geplanten RTO möglich.',
      methodik: 'Recovery per ASR-Failover-Plan (automatisiert, geordnet nach Recovery-Gruppen) oder Neubereitstellung über Infrastructure-as-Code.',
    },
    plan: {
      schritte: [
        'Azure-Statusseite prüfen und betroffene Region bestätigen.',
        'ASR-Failover-Plan starten bzw. dessen Ausführung veranlassen.',
        'Recovery-Reihenfolge (kritische Workloads zuerst) überwachen.',
        'Nach Failover: Erreichbarkeit prüfen und Nutzer informieren; Rückkehr-Strategie festlegen.',
      ],
    },
  },
  {
    id: 'kubernetes',
    category: 'virt',
    name: 'Kubernetes',
    docs: 'https://kubernetes.io/docs/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. Kubernetes startet ausgefallene Pods/Nodes automatisch neu bzw. plant sie um; Control-Plane-HA (min. 3 Nodes) und etcd-Backups sichern den Clusterzustand.',
      auswirkung: 'Bei Node-Ausfall werden die Workloads auf freie Nodes umgeplant (kurze Pod-Neustarts); bei Control-Plane-Ausfall ist die Verwaltung, nicht aber der Workload-Betrieb gestört.',
      methodik: 'Recovery durch Selbstheilung (Rescheduling); Cluster-Recovery über etcd-Snapshot-Restore und Neuinstallation der Control Plane.',
    },
    plan: {
      schritte: [
        'Cluster-Status prüfen und betroffene Nodes identifizieren lassen.',
        'Pod-Rescheduling auf verbleibende Nodes überwachen.',
        'Kritische Services auf Funktionstüchtigkeit prüfen lassen.',
        'Bei Control-Plane-Fall: etcd-Restore veranlassen und Cluster neu aufbauen.',
      ],
    },
  },

  // --- Messaging & Integration ---
  {
    id: 'kafka',
    category: 'mq',
    name: 'Apache Kafka',
    docs: 'https://kafka.apache.org/documentation/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. Kafka repliziert Partitionsdaten über Broker hinweg (RF=3 üblich); bei Broker-Ausfall übernehmen In-Sync-Replikate automatisch die Führung.',
      auswirkung: 'Bei Broker-Ausfall bleibt der Datenfluss mit reduzierter Kapazität bestehen; bei Replication-Factor 1 oder abgehängten Replikaten droht Nachrichtenverlust.',
      methodik: 'Recovery per automatischer Leader-Wahl der In-Sync-Replikate; standortübergreifend über MirrorMaker 2 bzw. Confluent Replicator.',
    },
    plan: {
      schritte: [
        'Broker-Ausfall im Monitoring bestätigen und Replikationsstatus prüfen.',
        'Leader-Verteilung und Datenfluss (Lag) überwachen lassen.',
        'Bei Standortfall: MirrorMaker-Umschaltung auf Replikat-Cluster veranlassen.',
        'Ausgefallenen Broker instand setzen und ISR (In-Sync-Replicas) wiederherstellen.',
      ],
    },
  },
  {
    id: 'rabbitmq',
    category: 'mq',
    name: 'RabbitMQ',
    docs: 'https://www.rabbitmq.com/docs',
    konzept: {
      faehigkeit: 'Mittlere bis hohe Recovery-Fähigkeit. RabbitMQ-Cluster spiegeln klassisch Queues (Quorum Queues über Raft); Nachrichten-Persistenz auf Disk schützt vor Broker-Neustart.',
      auswirkung: 'Bei Knotenausfall übernehmen verbleibende Quorum-Mitglieder; bei Totalausfall drohen nicht persistente Nachrichten verloren zu gehen.',
      methodik: 'Recovery per Quorum-Queue-Failover im Cluster; bei Totalausfall Restore aus persistierten Nachrichten-Storage bzw. Wiedereinlieferung durch Producer.',
    },
    plan: {
      schritte: [
        'Cluster-Status prüfen und verbleibende Knoten bestätigen.',
        'Queue-Verfügbarkeit und aufgelaufene Nachrichtenmengen prüfen.',
        'Bei Totalausfall: Restore-Auftrag veranlassen bzw. Producer-Wiedereinspielung abstimmen.',
        'Verzögerte Verarbeitung priorisieren und Fachbereiche informieren.',
      ],
    },
  },

  // --- Identity & Verzeichnisdienste ---
  {
    id: 'ad',
    category: 'iam',
    name: 'Microsoft Active Directory',
    docs: 'https://learn.microsoft.com/windows-server/identity/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit. AD ist multimaster-repliziert; mehrere Domain Controller pro Standort und Standort-Replikation schützen vor Einzel- und Standortausfällen; System State Backup erlaubt Forest-Recovery.',
      auswirkung: 'Bei Totalausfall sind Anmeldung, Gruppenrichtlinien und zentrale Authentifizierung gestört; verbleibende DCs bedienen den Betrieb eingeschränkt weiter.',
      methodik: 'Recovery über verbleibende Domain Controller (automatische Replikation); im Katastrophenfall Forest Recovery aus System State Backups (authoritative Restore).',
    },
    plan: {
      schritte: [
        'Anmeldefähigkeit an verbleibenden Domain Controllern prüfen.',
        'Replikationsstatus (dcpromo/repadmin) prüfen lassen.',
        'Bei Totalausfall: Forest-Recovery-Plan aktivieren und Priorität kritischer Services setzen.',
        'Nach Stabilisierung: fehlende DCs neu aufbauen und Replikation überwachen.',
      ],
    },
  },
  {
    id: 'entra',
    category: 'iam',
    name: 'Microsoft Entra ID (Azure AD)',
    docs: 'https://learn.microsoft.com/entra/',
    konzept: {
      faehigkeit: 'Sehr hohe Recovery-Fähigkeit. Globaler Microsoft-Cloud-Dienst mit automatischer Redundanz; wichtige On-Prem-Abhängigkeit ist der Entra Connect Sync-Server bzw. Pass-through-Authentication-Agent.',
      auswirkung: 'Bei Ausfall von Entra Connect ist die Synchronisierung von On-Prem-Änderungen und ggf. die Pass-through-Anmeldung gestört; Cloud-Authentifizierung läuft weiter.',
      methodik: 'Recovery des Sync-Servers über Staging-Mode-Server (manueller bzw. automatischer Failover); Cloud-Rollen bleiben von Microsoft-SLA abgedeckt.',
    },
    plan: {
      schritte: [
        'Prüfen, ob Cloud-Anmeldungen (z. B. Microsoft 365) funktionieren.',
        'Bei Sync-Ausfall: Staging-Server zum aktiven Sync-Server hochstufen lassen.',
        'Sync-Warteschlange und Fehler im Entra Portal prüfen.',
        'Nach Wiederanlauf: Synchronisierungsstatus bestätigen und dokumentieren.',
      ],
    },
  },

  // --- Monitoring & Betrieb ---
  {
    id: 'zabbix',
    category: 'ops',
    name: 'Zabbix / Prometheus',
    docs: 'https://www.zabbix.com/documentation / https://prometheus.io/docs/',
    konzept: {
      faehigkeit: 'Mittlere Recovery-Fähigkeit. Monitoring-Datenbank und Konfiguration sind backup- und neu installierbar; während eines Ausfalls fehlen Metriken, aber die überwachten Systeme laufen unbeeinflusst weiter.',
      auswirkung: 'Überwachungslücke: Alarme werden nicht ausgeliefert; historische Metriken gehen für die Ausfallzeit verloren; betreute Systeme selbst sind nicht betroffen.',
      methodik: 'Recovery durch Restore der Monitoring-Datenbank bzw. Redeploy der Monitoring-Stacks (IaC); Agents puffern lokal begrenzt Daten.',
    },
    plan: {
      schritte: [
        'Überwachungslücke im Team kommunizieren (manuelle Checks anweisen).',
        'Monitoring-Server wiederherstellen bzw. neu provisionieren.',
        'Agent-Konnektivität und Alarmzustände prüfen lassen.',
        'Wiederhergestelltes Monitoring abnehmen und Wartungsfenster schließen.',
      ],
    },
  },
  {
    id: 'servicenow',
    category: 'ops',
    name: 'ServiceNow / ITSM-Tool',
    docs: 'https://docs.servicenow.com/',
    konzept: {
      faehigkeit: 'Hohe Recovery-Fähigkeit (Cloud-SaaS). ServiceNow betreibt redundante Rechenzentren; kundenseitige Wiederherstellung betrifft v. a. Integrationsendpunkte und Datenimporte.',
      auswirkung: 'Ticket- und Change-Prozesse sind eingeschränkt; Notfallkommunikation muss auf Ersatzkanäle (Telefon, E-Mail-Verteiler) ausweichen.',
      methodik: 'Recovery durch Microsoft-/ServiceNow-seitiges Failover zwischen Rechenzentren; kundenseitig Wiederherstellung der Integrations- und Ersatzkommunikationswege.',
    },
    plan: {
      schritte: [
        'ServiceNow-Statusseite prüfen und Ausfallumfang bestätigen.',
        'Notfallkommunikationsweg (E-Mail/Telefonliste) aktivieren.',
        'Ticket-Pufferung für Nachträgerfassung im Team anweisen.',
        'Nach Wiederanlauf: Tickets nachtragen und Incident abschließen.',
      ],
    },
  },
]

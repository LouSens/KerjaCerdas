--
-- PostgreSQL database dump
--

\restrict t2rdGrfdURPqopZSMnS5lt6cqJPiSz0GJYyu6hsb4J1IhYiTSPIvHiqCfzEnqZe

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_logs (
    id character varying(36) NOT NULL,
    request_id character varying(100) NOT NULL,
    user_id character varying(36),
    role character varying(100) NOT NULL,
    task character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    latency_ms integer NOT NULL,
    tokens_in integer NOT NULL,
    tokens_out integer NOT NULL,
    success boolean NOT NULL,
    error text,
    flagged boolean NOT NULL,
    rating character varying(20),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.ai_logs OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id character varying(36) NOT NULL,
    job_id character varying(36) NOT NULL,
    seeker_id character varying(36) NOT NULL,
    status character varying(50) NOT NULL,
    cover_letter text NOT NULL,
    match_score double precision NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    seeker_id character varying(36),
    title character varying(255) NOT NULL,
    messages jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    provider character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    skills_taught jsonb NOT NULL,
    duration character varying(100) NOT NULL,
    cost_idr integer NOT NULL,
    is_prakerja boolean NOT NULL,
    level character varying(50) NOT NULL,
    url character varying(255),
    description text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: employers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employers (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    company_name character varying(255) NOT NULL,
    npwp character varying(50),
    industry character varying(100) NOT NULL,
    size character varying(20) NOT NULL,
    region_code character varying(50) NOT NULL,
    website character varying(255),
    description text NOT NULL,
    verified character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.employers OWNER TO postgres;

--
-- Name: gamification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gamification (
    id character varying(36) NOT NULL,
    seeker_id character varying(36) NOT NULL,
    xp integer NOT NULL,
    level integer NOT NULL,
    streak_days integer NOT NULL,
    badges jsonb NOT NULL,
    quests_completed jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.gamification OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id character varying(36) NOT NULL,
    employer_id character varying(36) NOT NULL,
    title character varying(255) NOT NULL,
    kbji_code character varying(50) NOT NULL,
    description text NOT NULL,
    responsibilities jsonb NOT NULL,
    required_skills jsonb NOT NULL,
    nice_to_have_skills jsonb NOT NULL,
    education_min character varying(10) NOT NULL,
    experience_years_min integer NOT NULL,
    region_code character varying(50) NOT NULL,
    remote_allowed boolean NOT NULL,
    salary_min integer NOT NULL,
    salary_max integer NOT NULL,
    is_active boolean NOT NULL,
    embedding public.vector(768),
    embedding_model character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.matches (
    id character varying(36) NOT NULL,
    subject_kind character varying(20) NOT NULL,
    subject_id character varying(36) NOT NULL,
    top_k integer NOT NULL,
    results jsonb NOT NULL,
    embedding_model character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.matches OWNER TO postgres;

--
-- Name: seekers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seekers (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    full_name character varying(255) NOT NULL,
    headline character varying(255) NOT NULL,
    nik character varying(16),
    nik_verified character varying(20) NOT NULL,
    date_of_birth character varying(20),
    region_code character varying(50) NOT NULL,
    preferred_regions jsonb NOT NULL,
    skills jsonb NOT NULL,
    experience jsonb NOT NULL,
    education jsonb NOT NULL,
    resume_text text NOT NULL,
    salary_expectation_min integer NOT NULL,
    salary_expectation_max integer NOT NULL,
    open_to_remote boolean NOT NULL,
    embedding public.vector(768),
    embedding_model character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.seekers OWNER TO postgres;

--
-- Name: skill_gaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_gaps (
    id character varying(36) NOT NULL,
    seeker_id character varying(36) NOT NULL,
    target_job_id character varying(36),
    missing_skills jsonb NOT NULL,
    matching_skills jsonb NOT NULL,
    gap_severity character varying(20) NOT NULL,
    match_percentage double precision NOT NULL,
    recommended_courses jsonb NOT NULL,
    estimated_readiness_months integer NOT NULL,
    summary text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.skill_gaps OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: ai_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_logs (id, request_id, user_id, role, task, model, latency_ms, tokens_in, tokens_out, success, error, flagged, rating, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
5a748883f1d9
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, job_id, seeker_id, status, cover_letter, match_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, user_id, seeker_id, title, messages, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, name, provider, category, skills_taught, duration, cost_idr, is_prakerja, level, url, description, created_at, updated_at) FROM stdin;
4fa46f70-2c83-4dfa-afb0-9f4a639df9e6	Bangkit Academy — Machine Learning Path	Bangkit (Kominfo + GoTo + Traveloka)	tech	["Python", "Machine Learning", "TensorFlow", "SQL"]	6 bulan	0	t	intermediate	\N	Program lead-by-industry, sertifikasi setara D2 Pemerintah.	2026-06-01 23:29:11.924295+00	2026-06-01 23:29:11.924297+00
1ef95268-0105-49df-bfe0-fd9247ca9dc0	Hacktiv8 — Full-Stack JavaScript Bootcamp	Hacktiv8	tech	["JavaScript", "Node.js", "React", "PostgreSQL", "Git"]	12 minggu intensif	28000000	f	beginner	\N	Bootcamp full-stack ISA tersedia, alumni di Tokopedia/Gojek.	2026-06-01 23:29:11.928781+00	2026-06-01 23:29:11.928784+00
f7657e17-cc20-4900-af19-69fc318f30a9	Purwadhika — Data Science Bootcamp	Purwadhika Digital Talent	tech	["Python", "Statistika", "Machine Learning", "Tableau", "SQL"]	16 minggu	23500000	f	intermediate	\N	Bootcamp Data Science populer, partnership 250+ hiring partner.	2026-06-01 23:29:11.930747+00	2026-06-01 23:29:11.93075+00
64ce5bd1-6156-41d5-9565-4e9d37299c04	RevoU — Full-Stack Software Engineering	RevoU	tech	["JavaScript", "Node.js", "React", "Git", "AWS"]	4 bulan	21000000	f	beginner	\N	Bootcamp full-stack dengan job guarantee 4 bulan.	2026-06-01 23:29:11.933075+00	2026-06-01 23:29:11.933077+00
c7fe3fb8-1395-45a5-ba9d-d706d8cad7cf	Binar Academy — Android Engineering	Binar Academy	tech	["Android", "Kotlin", "Git", "REST API"]	3 bulan	0	t	beginner	\N	Lulus pelatihan + sertifikat industri, banyak alumni di startup ID.	2026-06-01 23:29:11.935021+00	2026-06-01 23:29:11.935023+00
6da0d799-cde9-48f6-abf7-c22e8e6fbcea	Dicoding — Belajar Machine Learning untuk Pemula	Dicoding	tech	["Python", "Machine Learning", "Statistika"]	1 bulan	0	t	beginner	\N	Kelas pengantar ML Bahasa Indonesia, terbukti gratis via Prakerja.	2026-06-01 23:29:11.936894+00	2026-06-01 23:29:11.936896+00
9dc0faf7-52a5-47ea-a0c6-491fef78f80c	Dicoding — Belajar Membuat Aplikasi Android	Dicoding	tech	["Android", "Kotlin", "Git"]	1 bulan	400000	t	intermediate	\N	Kelas Android Bahasa Indonesia, kurikulum Google certified.	2026-06-01 23:29:11.938795+00	2026-06-01 23:29:11.938797+00
80f3e88d-c3e2-4545-a41a-7ed11264d48c	Google Data Analytics Professional Certificate	Coursera ID	tech	["SQL", "Excel", "Tableau", "Statistika", "R"]	6 bulan (10 jam/minggu)	590000	f	beginner	\N	Sertifikat Google, tersedia subsidi via beasiswa Coursera ID.	2026-06-01 23:29:11.940435+00	2026-06-01 23:29:11.940436+00
9c442584-4f53-404e-8294-5c276b6b1fdb	IBM Data Science Professional Certificate	Coursera ID	tech	["Python", "Machine Learning", "SQL", "Statistika"]	4 bulan	590000	f	intermediate	\N	Sertifikat IBM, fokus pipeline data science end-to-end.	2026-06-01 23:29:11.942148+00	2026-06-01 23:29:11.94215+00
9eeefa05-72d8-4456-850b-4703e1cf961c	Skill Academy — Digital Marketing Bersertifikat	Skill Academy by Ruangguru	marketing	["SEO", "Marketing", "Content Writing", "Excel"]	1 bulan	350000	t	beginner	\N	Modul digital marketing Indonesia, lulus sertifikat resmi.	2026-06-01 23:29:11.943992+00	2026-06-01 23:29:11.943994+00
05031768-f378-4535-aeef-03e920a28ebc	MySkill — Excel & Power BI untuk Bisnis	MySkill	finance	["Excel", "Power BI", "Data Analysis"]	1 bulan	199000	f	beginner	\N	Praktis untuk analis bisnis & supply chain.	2026-06-01 23:29:11.945656+00	2026-06-01 23:29:11.945658+00
bc71ab30-866d-4abd-948d-26ebbcad394e	Pintaria — SAP Logistics for Supply Chain	Pintaria	ops	["SAP", "Supply Chain", "S&OP", "Logistik"]	6 bulan	12000000	f	intermediate	\N	Sertifikasi SAP untuk profesional supply chain Indonesia.	2026-06-01 23:29:11.947224+00	2026-06-01 23:29:11.947225+00
9cc70e10-a0df-4cd3-99c3-dfda95bf1109	Apple Developer Academy ID — iOS Development	Apple Developer Academy (BINUS)	tech	["iOS", "Swift", "Design", "Git"]	9 bulan	0	f	intermediate	\N	Akademi gratis Apple di Indonesia (BINUS Tangerang).	2026-06-01 23:29:11.948962+00	2026-06-01 23:29:11.948964+00
051731b4-e6ed-488a-b5ac-2ac01445e32a	Cakap — Bahasa Inggris Karier	Cakap	language	["Bahasa Inggris", "Komunikasi"]	3 bulan	900000	t	beginner	\N	Live class English profesional Indonesia.	2026-06-01 23:29:11.950865+00	2026-06-01 23:29:11.950867+00
07426e0c-4f76-443d-9310-79e427fc7a6c	Arkademi — Akuntansi Praktis untuk UMKM	Arkademi	finance	["Akuntansi", "Excel", "Pajak"]	2 bulan	350000	t	beginner	\N	Praktis akuntansi UMKM, mengantongi sertifikasi Prakerja.	2026-06-01 23:29:11.95251+00	2026-06-01 23:29:11.952511+00
\.


--
-- Data for Name: employers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employers (id, user_id, company_name, npwp, industry, size, region_code, website, description, verified, created_at, updated_at) FROM stdin;
d6f97708-71d6-42fe-a6a6-c87239c1907d	d6f97708-71d6-42fe-a6a6-c87239c1907d	GoTo Group (Gojek/Tokopedia)	\N	Tech / Marketplace	enterprise	3174	\N	Super-app dari Indonesia menghubungkan jutaan pengguna ke layanan transportasi, e-commerce, dan keuangan.	unverified	2026-06-01 23:29:11.656959+00	2026-06-01 23:29:11.656962+00
55e8d306-e0da-42e7-aa30-69155251a1c3	55e8d306-e0da-42e7-aa30-69155251a1c3	Bank Mandiri	\N	Perbankan	enterprise	3171	\N	Bank BUMN terbesar di Indonesia, pelopor transformasi digital banking.	unverified	2026-06-01 23:29:11.665863+00	2026-06-01 23:29:11.665865+00
e58270f4-8173-448b-9c3d-69adbfb2efe5	e58270f4-8173-448b-9c3d-69adbfb2efe5	Bank Central Asia (BCA)	\N	Perbankan	enterprise	3171	\N	Bank swasta terbesar di Indonesia dengan layanan digital banking terdepan.	unverified	2026-06-01 23:29:11.67119+00	2026-06-01 23:29:11.671192+00
6a0d5e67-5c78-4d2e-ab54-1ac3b8260731	6a0d5e67-5c78-4d2e-ab54-1ac3b8260731	Telkom Indonesia	\N	Telekomunikasi	enterprise	3273	\N	BUMN telekomunikasi, operator IndiHome dan Telkomsel.	unverified	2026-06-01 23:29:11.675694+00	2026-06-01 23:29:11.675696+00
87d446bc-833d-4c53-8393-1a183305f7fa	87d446bc-833d-4c53-8393-1a183305f7fa	Pertamina	\N	Energi / Migas	enterprise	6471	\N	BUMN energi terbesar di Indonesia, hulu sampai hilir migas.	unverified	2026-06-01 23:29:11.680305+00	2026-06-01 23:29:11.680307+00
59078236-13cd-4bb3-8dbd-037533591f3b	59078236-13cd-4bb3-8dbd-037533591f3b	Bibit Tumbuh Bersama	\N	Fintech / Wealth	mid	3174	\N	Aplikasi investasi reksadana #1 dengan basis pengguna 4 juta+ investor ritel.	unverified	2026-06-01 23:29:11.684995+00	2026-06-01 23:29:11.684998+00
4357eac0-4853-4444-9128-d674d517f932	4357eac0-4853-4444-9128-d674d517f932	Ruangguru	\N	Edutech	mid	3174	\N	Platform belajar online terbesar di Asia Tenggara, mendukung jutaan siswa.	unverified	2026-06-01 23:29:11.689276+00	2026-06-01 23:29:11.689278+00
006f66e1-9d2c-4c1f-85b9-0813e3a2b89b	006f66e1-9d2c-4c1f-85b9-0813e3a2b89b	Halodoc	\N	Healthtech	mid	3174	\N	Aplikasi kesehatan: konsultasi dokter, apotek antar, vaksinasi & tes lab.	unverified	2026-06-01 23:29:11.693645+00	2026-06-01 23:29:11.693647+00
b398d77e-3016-4ebf-aa1b-6918a26391fd	b398d77e-3016-4ebf-aa1b-6918a26391fd	Indofood Sukses Makmur	\N	FMCG / Pangan	enterprise	3578	\N	Produsen mi instan, tepung, dan bahan pangan rumah tangga terbesar.	unverified	2026-06-01 23:29:11.698053+00	2026-06-01 23:29:11.698055+00
0ade53d6-c7f6-4dc8-8727-f2a65649699b	0ade53d6-c7f6-4dc8-8727-f2a65649699b	Garuda Indonesia	\N	Penerbangan	enterprise	3171	\N	Maskapai penerbangan nasional, melayani rute domestik dan internasional.	unverified	2026-06-01 23:29:11.702032+00	2026-06-01 23:29:11.702034+00
63bb6919-c375-4d6e-81b1-ba6497623e71	63bb6919-c375-4d6e-81b1-ba6497623e71	Traveloka	\N	Tech / Travel	enterprise	3174	\N	Platform travel & lifestyle terbesar di Asia Tenggara.	unverified	2026-06-01 23:29:11.706269+00	2026-06-01 23:29:11.706271+00
73545ec7-306a-4b45-9e88-eede9fcda73b	73545ec7-306a-4b45-9e88-eede9fcda73b	Sayurbox	\N	Agritech / Grocery	mid	3174	\N	Belanja sayur & bahan segar langsung dari petani.	unverified	2026-06-01 23:29:11.710428+00	2026-06-01 23:29:11.710429+00
9fad9c42-ef07-46e8-ab7c-d2cfb06a2673	9fad9c42-ef07-46e8-ab7c-d2cfb06a2673	Astra International	\N	Otomotif / Konglomerat	enterprise	3271	\N	Konglomerat otomotif (Toyota, Daihatsu, Honda motor), agribisnis, jasa keuangan.	unverified	2026-06-01 23:29:11.714299+00	2026-06-01 23:29:11.714301+00
a83585e1-60d7-4401-bf98-e065752485f7	a83585e1-60d7-4401-bf98-e065752485f7	Kalbe Farma	\N	Farmasi / Healthcare	enterprise	3174	\N	Perusahaan farmasi terbesar di Asia Tenggara berbasis Indonesia.	unverified	2026-06-01 23:29:11.718539+00	2026-06-01 23:29:11.71854+00
e1a9ea4c-d64a-43fd-9d22-f216caeb02eb	e1a9ea4c-d64a-43fd-9d22-f216caeb02eb	Pegadaian	\N	Keuangan / BUMN	enterprise	3471	\N	Lembaga keuangan BUMN, layanan gadai, emas, dan mikrofinansial.	unverified	2026-06-01 23:29:11.722798+00	2026-06-01 23:29:11.7228+00
3329a173-0f3e-46af-988e-c439a34e2392	3329a173-0f3e-46af-988e-c439a34e2392	Unilever Indonesia	\N	FMCG	enterprise	3171	\N	Produsen consumer goods global; brand Wall's, Sunsilk, Bango, Rinso, dll.	unverified	2026-06-01 23:29:11.727804+00	2026-06-01 23:29:11.727806+00
21f8bed8-2acc-4f26-8019-78935c06d771	21f8bed8-2acc-4f26-8019-78935c06d771	RedDoorz	\N	Hospitality / Tech	mid	5171	\N	Aplikasi pemesanan hotel budget terbesar di Asia Tenggara.	unverified	2026-06-01 23:29:11.73225+00	2026-06-01 23:29:11.732252+00
1072c387-fc8a-4f3c-87a8-77cd81487f05	1072c387-fc8a-4f3c-87a8-77cd81487f05	Shopee Indonesia	\N	E-commerce	enterprise	3174	\N	Platform e-commerce #1 di Indonesia, ekosistem Sea Group.	unverified	2026-06-01 23:29:11.736524+00	2026-06-01 23:29:11.736526+00
dfe4742a-e639-44c0-8ba1-482417456e27	dfe4742a-e639-44c0-8ba1-482417456e27	TaniHub	\N	Agritech	mid	3573	\N	Marketplace B2B yang menghubungkan petani Indonesia ke buyer besar.	unverified	2026-06-01 23:29:11.740565+00	2026-06-01 23:29:11.740567+00
e5eca8ff-c461-4753-a43e-96a9b22f12b2	e5eca8ff-c461-4753-a43e-96a9b22f12b2	Kalbio Global Medika	\N	Bioteknologi	mid	3171	\N	Perusahaan vaksin & terapi biologis afiliasi Kalbe Group.	unverified	2026-06-01 23:29:11.744474+00	2026-06-01 23:29:11.744475+00
\.


--
-- Data for Name: gamification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gamification (id, seeker_id, xp, level, streak_days, badges, quests_completed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, employer_id, title, kbji_code, description, responsibilities, required_skills, nice_to_have_skills, education_min, experience_years_min, region_code, remote_allowed, salary_min, salary_max, is_active, embedding, embedding_model, created_at, updated_at) FROM stdin;
1bda0cd9-9084-4b92-ad79-fa5ae9400acd	d6f97708-71d6-42fe-a6a6-c87239c1907d	Senior Backend Engineer (Go)	2511	Bangun layanan microservice high-throughput untuk fitur pembayaran Gojek/Tokopedia.	["Desain API REST & gRPC", "Optimasi latency pada Kafka pipeline", "Mentoring engineer junior"]	["Go", "PostgreSQL", "Kafka", "Docker", "Kubernetes"]	["gRPC", "Redis"]	S1	4	3174	t	25000000	42000000	t	[0.009028028,0.17911607,-0.07114086,-0.026361842,-0.0888358,0.17153253,-0.118086606,-0.06825189,0.15492097,0.09425261,-0.34125945,0.17369926,0.31345314,-0.18850522,0.26975748,0.04189005,0.07041862,-0.08053001,0.21161698,-0.25386813,0.14769854,-0.120614454,0.12278118,0.046945747,0.062112834,0.041167807,0.3163421,-0.48426342,-0.041167807,0.037195474,0.021306146,0.018778298,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.745838+00	2026-06-01 23:29:11.74584+00
0e27c55b-ac9f-440c-a558-6266adba7633	55e8d306-e0da-42e7-aa30-69155251a1c3	Junior Data Analyst (Banking)	2511	Analisis data transaksi nasabah untuk dashboard manajemen risiko & marketing campaign.	["Bikin SQL query produk tabungan", "Bangun dashboard Tableau", "Laporan eksekutif bulanan"]	["SQL", "Excel", "Tableau", "Statistika"]	["Python", "Power BI"]	S1	0	3171	f	8000000	13000000	t	[0.043909263,-0.014050964,0.051812932,0.24852642,0.014929149,0.064546615,-0.2507219,0.0030736485,0.15895154,-0.037761968,-0.14841332,0.1730025,-0.10494314,0.14577876,-0.25818646,-0.46763366,0.34688318,-0.11811592,0.29770482,-0.054447487,-0.0715721,-0.08737943,0.038640153,0.33634496,0.22174178,-0.1304105,0.0891358,0.005708204,-0.1901271,0.044787448,-0.064546615,0.013611872,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.761481+00	2026-06-01 23:29:11.761484+00
790b7a56-a6ca-416d-994b-9a1688bd50b2	d6f97708-71d6-42fe-a6a6-c87239c1907d	Mobile Engineer - Flutter	2511	Develop fitur baru aplikasi Tokopedia Seller di Android & iOS.	["Implementasi UI Flutter", "Integrasi REST API", "A/B testing fitur"]	["Flutter", "Dart", "REST API", "Git"]	["Firebase", "iOS", "Android Studio"]	S1	2	3174	f	18000000	28000000	t	[0.29631382,-0.24232575,0.07663824,0.008687735,0.026994035,-0.00744663,-0.21998586,0.061434697,-0.1175947,0.00031027626,0.15017371,-0.110458344,0.06732994,-0.27397394,0.18399382,-0.011790497,0.16630808,-0.08563624,0.12907492,-0.29569328,-0.010239116,-0.27893835,0.16165392,-0.20416178,0.27676642,0.15637924,0.26218343,-0.3527841,-0.016444642,0.07074299,-0.117284425,-0.18523492,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.764231+00	2026-06-01 23:29:11.764233+00
d1028620-00ff-4258-8b94-1d51c87c1608	6a0d5e67-5c78-4d2e-ab54-1ac3b8260731	Network Engineer (FTTH)	2152	Operasi dan troubleshoot jaringan akses IndiHome FTTH wilayah Bandung Raya.	["Maintenance OLT/ONT", "Network monitoring", "Penanganan eskalasi pelanggan"]	["TCP/IP", "Cisco IOS", "Linux", "FTTH"]	["Mikrotik", "OSPF"]	D3	2	3273	f	12000000	20000000	t	[0.002976059,-0.039432783,-0.16479927,0.098581955,0.05431308,0.08444568,-0.111974224,-0.23920076,0.036084715,0.005580111,0.10193002,0.03162063,0.21390425,0.020088399,0.3485709,-0.14917496,-0.100069985,-0.13801473,-0.21018417,-0.12313444,0.1811676,-0.03980479,-0.15996318,0.025296502,-0.030504605,-0.47951752,-0.013764273,-0.20981216,0.41999635,0.2782615,0.00037200737,-0.03385267,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.766774+00	2026-06-01 23:29:11.766775+00
3d3cc302-0f1b-4b73-9bf5-096bf015df23	87d446bc-833d-4c53-8393-1a183305f7fa	Petroleum Engineer (Production)	2146	Optimasi produksi sumur minyak di lapangan East Kalimantan.	["Well testing", "Reservoir analysis", "Production reporting"]	["Petroleum Engineering", "PROSPER", "PETREL", "Drilling"]	["MATLAB", "Python"]	S1	3	6471	f	15000000	28000000	t	[0.20870027,0.097089194,-0.23732914,0.18339069,-0.04688495,-0.2584896,-0.06846033,0.031948153,0.26803255,-0.033607796,0.043980576,0.2962465,-0.23649931,-0.38711202,0.004978933,0.11866457,0.14521888,-0.07551382,-0.102483034,-0.010787688,-0.27674568,-0.12654787,0.10787688,-0.20704062,-0.025309576,-0.066800684,-0.0634814,-0.13318646,0.12530315,0.40163392,0.04232093,0.09791902,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.769436+00	2026-06-01 23:29:11.769439+00
f70ea279-91de-43f2-a433-a75d22734b53	59078236-13cd-4bb3-8dbd-037533591f3b	Product Designer	2166	Desain pengalaman investasi reksadana untuk pengguna ritel pemula.	["User research", "Wireframe & prototyping", "Usability testing"]	["Figma", "User Research", "Design System", "Prototyping"]	["Illustration", "Bahasa Inggris"]	S1	2	3174	t	14000000	22000000	t	[0.04904026,0.118922636,0.11401861,0.17736228,-0.050674938,0.083777115,-0.24724466,0.050674938,0.11074926,0.012668734,-0.1495728,0.2950589,-0.067839034,-0.29178956,0.13526939,0.18226631,0.19902173,-0.30323228,-0.11238394,-0.1745016,0.18839635,-0.19779573,0.011442728,-0.20964712,0.0997152,-0.06865637,0.24765332,-0.32448307,0.17654495,0.13159136,0.10216721,0.26277408,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.771974+00	2026-06-01 23:29:11.771975+00
9fb127c6-b894-4afa-b84d-d831e4d06440	4357eac0-4853-4444-9128-d674d517f932	Content Writer (Bahasa Indonesia)	2641	Tulis artikel SEO & soal latihan kurikulum SMA untuk platform Ruangguru.	["Riset topik", "Tulisan 800-1500 kata SEO", "Editorial review"]	["Bahasa Indonesia", "SEO", "Content Writing", "Riset"]	["WordPress", "Photoshop"]	S1	1	3174	t	6000000	10000000	t	[0.20831186,-0.19458069,-0.24381194,0.079037935,-0.29471773,0.12291069,-0.06463695,0.16745326,-0.17214195,-0.36069432,-0.12090125,0.14534943,0.21233073,-0.22840624,-0.060952984,0.013061354,0.34696314,-0.1795099,-0.060283173,-0.16577873,0.18955709,0.011721728,0.036839716,-0.112863496,0.072674714,0.010382102,0.23242512,-0.33055273,0.09611817,-0.03550009,0.049566165,-0.0820521,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.774211+00	2026-06-01 23:29:11.774213+00
cbf329c8-e216-452d-beac-1cdc7a13bf0d	006f66e1-9d2c-4c1f-85b9-0813e3a2b89b	Backend Engineer (Python)	2511	Bangun layanan API untuk Halodoc Apotek (Apotek Antar) — order, inventory, fulfillment.	["Develop microservice FastAPI", "DB schema PostgreSQL", "Unit + integration test"]	["Python", "FastAPI", "PostgreSQL", "Docker"]	["AWS", "Redis", "Celery"]	S1	2	3174	t	16000000	28000000	t	[0.13574055,0.029307619,-0.044347055,0.15617876,-0.11260296,-0.13149865,-0.06054337,-0.07018403,0.1581069,0.021595087,-0.22713403,0.058615237,0.052059583,-0.060157742,0.22906217,-0.29577556,0.20823833,0.3401226,0.13419804,-0.1322699,0.16466254,0.042804547,-0.11221733,0.07905345,-0.021980714,-0.17661697,0.16813318,-0.48087633,0.18047322,0.13188428,-0.310815,-0.0944785,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.776786+00	2026-06-01 23:29:11.776787+00
f509c624-78b3-4fd6-8b6d-2c62e629f7c7	e58270f4-8173-448b-9c3d-69adbfb2efe5	Risk Management Analyst	2412	Pemodelan credit risk untuk produk kartu kredit dan KPR.	["Modeling PD/LGD/EAD", "Stress testing", "Laporan ke OJK"]	["Statistika", "SAS", "SQL", "Risk Management"]	["Python", "R"]	S1	2	3171	f	10000000	18000000	t	[-0.1445887,-0.13303752,0.08563793,0.40429068,0.14976679,0.041823175,0.060145706,-0.1649028,-0.021110745,-0.22186197,0.18163207,0.050984442,-0.14618196,-0.19358155,-0.14419037,0.024297273,-0.025093904,0.0724935,-0.21150577,-0.015932638,0.19119166,-0.43535933,-0.2222603,0.289974,0.13383415,-0.056162547,0.09838404,-0.26567674,0.13941059,0.09479919,0.06651876,0.1597247,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.779164+00	2026-06-01 23:29:11.779165+00
a897ff57-aa39-4397-a5a7-557d6f6c81be	b398d77e-3016-4ebf-aa1b-6918a26391fd	Supply Chain Manager (FMCG)	1324	Pimpin S&OP planning untuk lini produk mi instan di pabrik Surabaya.	["Demand forecasting", "Vendor negotiation", "KPI inventory turnover"]	["Supply Chain", "S&OP", "SAP", "Negotiation"]	["Six Sigma", "Power BI"]	S1	5	3578	f	18000000	30000000	t	[0.24881768,-0.10228778,-0.0031854326,-0.06866377,0.18156967,0.06052322,-0.063354716,0.06406259,0.17767635,-0.1982047,-0.051674794,0.37517318,-0.08848424,-0.1695358,-0.29412162,0.20740706,0.32809955,-0.32243657,0.041056685,-0.12493975,-0.04388818,-0.009556298,0.10087203,-0.23005903,0.16918187,-0.08246731,0.17449091,-0.34544247,-0.08352912,-0.027253145,-0.06901771,0.07786613,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.781374+00	2026-06-01 23:29:11.781376+00
0994313c-0605-42e0-bc1c-1269b16c9148	0ade53d6-c7f6-4dc8-8727-f2a65649699b	Cabin Crew (Fresh Recruit)	5111	Layanan penumpang pesawat rute domestik & internasional Garuda Indonesia.	["Safety briefing", "In-flight service", "Penanganan penumpang khusus"]	["Bahasa Inggris", "Komunikasi", "Service Mindset", "Penampilan"]	["Bahasa Mandarin"]	D3	0	3171	f	7000000	12000000	t	[-0.13716625,0.05286616,-0.11752004,0.15395483,0.22539559,0.21253625,-0.03964962,-0.012502132,0.07394118,-0.17502984,-0.02178943,0.13395141,-0.07144076,-0.32576984,-0.07144076,-0.16181332,0.123949714,0.15681246,0.04357886,-0.37077752,-0.16967179,0.053223364,-0.0067868717,-0.44829074,0.14359592,0.1607417,0.29647914,-0.1886036,-0.012502132,0.24432738,-0.059295826,-0.029647913,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.783735+00	2026-06-01 23:29:11.783737+00
19c7cc14-dc85-4c7b-9e5c-8ec25602e718	63bb6919-c375-4d6e-81b1-ba6497623e71	Data Scientist (Pricing)	2511	Bangun model pricing & ranking dinamis untuk pencarian tiket pesawat.	["Feature engineering", "Eksperimen A/B", "Deploy model production"]	["Python", "Machine Learning", "SQL", "Spark"]	["TensorFlow", "Airflow"]	S1	3	3174	t	22000000	38000000	t	[0.12660946,-0.0093619665,-0.17743157,0.12660946,-0.16762379,-0.011145199,0.07757058,0.06776281,0.28397965,0.00044580796,0.019169742,-0.12527204,0.06910023,-0.106993906,-0.07489573,0.03298979,-0.08648674,0.112789415,0.19303484,-0.05260534,0.38473225,0.078908004,-0.011145199,0.029423324,0.21175878,-0.06330473,0.5443315,-0.30359522,0.072220884,0.16717798,-0.041014332,0.30047455,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.785975+00	2026-06-01 23:29:11.785976+00
ab293585-8868-4491-8e5b-cd0ffa6a70ec	73545ec7-306a-4b45-9e88-eede9fcda73b	Operations Lead (Warehouse)	3331	Pimpin tim operasional fulfillment dark store Sayurbox area JABODETABEK.	["Schedule shift", "KPI on-time delivery", "Continuous improvement"]	["Operasional", "Leadership", "Excel", "Problem Solving"]	["Lean / Six Sigma"]	D3	3	3174	f	13000000	20000000	t	[0.08827878,0.20885466,0.24366377,0.014354272,0.2583769,0.1901941,-0.30215743,0.10191533,-0.10335076,0.062441085,-0.17117469,-0.022249121,0.052034236,-0.03480911,0.10729819,-0.03732111,0.1370833,0.007535993,0.012201131,-0.06925936,-0.01794284,0.107657045,-0.3075403,0.05275195,-0.061364513,-0.22249122,0.44749445,-0.17583984,0.22285008,0.37105793,0.12918845,0.04055082,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.788478+00	2026-06-01 23:29:11.78848+00
42a929d8-e594-42c1-aa37-0541e2012168	9fad9c42-ef07-46e8-ab7c-d2cfb06a2673	Mechanical Engineer (Automotive)	2144	Engineer lini produksi mobil Toyota di pabrik Karawang (Astra Daihatsu Motor).	["Process improvement", "Quality control", "Drawing review (CAD)"]	["AutoCAD", "Mechanical", "TPM", "Bahasa Inggris"]	["SolidWorks", "MES"]	S1	2	3271	f	11000000	18000000	t	[-0.1298696,0.009632272,0.010960861,-0.09167266,0.24412827,0.26106778,-0.27335724,0.1341875,-0.0073072407,-0.24279968,0.16972727,0.0807118,-0.13153033,-0.28531453,0.041186266,0.0674259,-0.100308485,0.023914605,0.3862873,-0.37931222,0.065765165,-0.16042715,0.11691585,-0.35074756,0.08370112,0.15743782,0.15345205,-0.1481377,0.01594307,0.0800475,-0.01727166,-0.0053143566,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.79085+00	2026-06-01 23:29:11.790852+00
dc576f52-e9f1-4be5-988f-ed0f9ce5e7b2	a83585e1-60d7-4401-bf98-e065752485f7	Quality Assurance Pharmacist	2262	QA produksi sediaan farmasi di pabrik Kalbe Bekasi.	["Validasi proses", "Audit CPOB", "Investigasi deviasi"]	["Farmasi", "CPOB", "Quality Assurance", "GMP"]	["LIMS", "Six Sigma"]	S1	1	3174	f	9000000	15000000	t	[-0.0063140765,0.14230958,0.22682106,-0.1345384,0.32978907,-0.058283783,-0.10442512,0.15493773,-0.046627026,-0.04905552,-0.11365338,0.028170496,0.18456532,-0.1073393,-0.31327534,0.044684235,0.14910935,-0.09131126,0.3273606,-0.27587658,0.15396634,0.17679414,-0.06945484,-0.17145146,0.01894223,0.13405271,0.1597947,-0.4584991,0.03837016,0.09956813,-0.111710586,0.1345384,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.79404+00	2026-06-01 23:29:11.794042+00
12899402-a30b-47bc-ba4f-2d3fae8a97ad	e1a9ea4c-d64a-43fd-9d22-f216caeb02eb	Customer Service Representative	4222	Layanan nasabah cabang Pegadaian Yogyakarta — gadai emas, KCA, tabungan emas.	["Layanan tatap muka nasabah", "Input transaksi", "Cross-sell produk"]	["Komunikasi", "Customer Service", "Penampilan", "Bahasa Indonesia"]	["Excel"]	D3	0	3471	f	5000000	8000000	t	[0.18656702,0.08380079,-0.08203657,-0.2663983,-0.18436174,-0.34622958,-0.00970325,-0.27830684,0.16892476,-0.059983727,0.22890848,0.07101014,0.122172736,-0.4000385,0.009262193,-0.060865838,-0.063512184,0.2919796,-0.050721534,-0.32020724,-0.032197148,-0.15657517,-0.011026421,0.13937396,-0.074979655,0.2033272,0.04807519,0.09041665,0.2765426,-0.011908534,0.0026463408,0.084682904,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.796421+00	2026-06-01 23:29:11.796422+00
6d06dbc9-5062-4a38-abe0-04b40e51ddf7	3329a173-0f3e-46af-988e-c439a34e2392	Marketing Specialist (FMCG)	2431	Eksekusi campaign brand personal-care (Sunsilk/Pepsodent) di kanal modern trade.	["Trade marketing plan", "Activation BTL", "Analisis sales data"]	["Marketing", "Trade Marketing", "Excel", "Bahasa Inggris"]	["Power BI", "Nielsen"]	S1	2	3171	f	13000000	20000000	t	[-0.0095274635,0.09832342,-0.28125072,0.013719547,0.04458853,0.2881105,-0.25266832,0.0041920836,0.03849095,0.2309457,0.013719547,-0.014481744,0.21150969,0.0777441,-0.18445168,0.14024426,-0.010670759,-0.030106783,-0.032774474,-0.4131108,0.17339984,-0.2873483,-0.11166187,-0.115091756,0.1284302,-0.017530533,-0.021722617,-0.2583848,0.07583861,0.35518384,0.20503101,0.1825462,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.798887+00	2026-06-01 23:29:11.798889+00
d4d2ee61-bbf7-47ee-ae0a-9e63f0840610	21f8bed8-2acc-4f26-8019-78935c06d771	Sales Executive (Hotel Partner)	3322	Akuisisi hotel & guest house budget di area Bali untuk listing RedDoorz.	["Door-to-door sales", "Negotiation kontrak", "Onboarding mitra"]	["Sales", "Negotiation", "Bahasa Indonesia", "Komunikasi"]	["Bahasa Inggris"]	SMA	1	5171	f	7000000	13000000	t	[0.18617696,-0.07068971,-0.04849643,0.12987179,0.08507424,-0.17590229,-0.01356256,-0.0057538133,0.11836416,0.00123296,-0.051373333,-0.047674455,0.02959104,-0.28851265,-0.20878123,0.28933463,0.15576395,-0.20590432,0.09123904,-0.46482593,0.13151574,-0.2860467,-0.13603659,-0.24618101,0.013151574,-0.06411392,0.036166828,-0.4072878,-0.055072214,-0.00493184,0.11014443,-0.12822784,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.801504+00	2026-06-01 23:29:11.801506+00
6ff951df-7c2b-482b-b746-4df6278f7067	1072c387-fc8a-4f3c-87a8-77cd81487f05	UI/UX Designer	2166	Desain alur checkout & promosi di aplikasi Shopee.	["Wireframe", "User testing", "Hand-off ke engineer"]	["Figma", "UI/UX", "Design System", "Prototyping"]	["After Effects", "User Research"]	S1	2	3174	t	15000000	25000000	t	[-0.0025492392,0.3144062,-0.098995455,0.05310915,-0.21668534,0.1746229,-0.17122391,-0.057782758,0.03696397,0.019119294,0.026342139,0.050984785,-0.1444569,-0.358593,0.1920427,0.016145183,0.12151374,0.16060208,0.03823859,-0.08285028,-0.08752388,-0.2901884,0.003823859,-0.031015744,-0.07562743,-0.05310915,0.0008497464,-0.28593966,0.34032345,0.1996904,-0.006797971,0.44611686,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.803682+00	2026-06-01 23:29:11.803684+00
5aeece31-a681-41d7-971b-fb5382c5f0d9	dfe4742a-e639-44c0-8ba1-482417456e27	Agriculture Field Officer	6111	Bina petani mitra di area Malang Raya untuk supply sayur & buah TaniHub.	["Field visit petani", "Edukasi GAP", "Quality control panen"]	["Pertanian", "Bahasa Indonesia", "Excel", "Komunikasi"]	["Excel", "Logistik"]	D3	1	3573	f	6000000	10000000	t	[0.40701854,-0.24584328,-0.050494783,-0.021932077,0.050494783,-0.10609005,0.18412744,0.14383362,0.06069575,-0.072426856,0.10711014,0.023462221,0.01224116,0.011221062,-0.22034086,-0.08058763,0.22544135,-0.2937878,0.18769777,-0.20401932,0.24737343,-0.054575168,-0.067836426,-0.14230348,0.18769777,0.06477614,0.09537903,-0.47383487,0.19126812,0.021932077,-0.02448232,-0.11170058,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.806348+00	2026-06-01 23:29:11.80635+00
2429a85c-e342-4425-a246-c38d5fb0ed3f	e5eca8ff-c461-4753-a43e-96a9b22f12b2	Biotechnology Research Associate	2131	Riset & development produk vaksin/biologic di lab Kalbio.	["Eksperimen sel mamalia", "Validasi assay", "Reporting ke principal scientist"]	["Bioteknologi", "Cell Culture", "ELISA", "Lab Safety"]	["Flow Cytometry", "qPCR"]	S1	1	3171	f	9000000	14000000	t	[-0.057218216,-0.15208972,-0.22222817,0.025840485,-0.01698089,0.21521433,0.12181943,-0.20635474,0.095978945,-0.08785765,0.058694817,-0.026209636,-0.12181943,-0.37874767,0.19121958,-0.14839822,-0.042452227,0.063493766,0.3470008,-0.13067903,-0.08785765,-0.09634809,0.09154915,-0.20229408,-0.23957822,-0.19380364,0.20709303,-0.3322348,-0.05094267,-0.0040606475,0.06718526,0.34146357,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.808597+00	2026-06-01 23:29:11.808599+00
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.matches (id, subject_kind, subject_id, top_k, results, embedding_model, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: seekers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seekers (id, user_id, full_name, headline, nik, nik_verified, date_of_birth, region_code, preferred_regions, skills, experience, education, resume_text, salary_expectation_min, salary_expectation_max, open_to_remote, embedding, embedding_model, created_at, updated_at) FROM stdin;
bdd23234-6c75-4a3e-8b5b-d1386c221289	13873fde-2d32-44d1-8c7d-de28d645928d	Andi Pratama	Fresh-graduate Statistika UI — fokus data analytics perbankan	\N	unverified	\N	3171	["3174"]	[{"name": "Python", "level": "intermediate", "years": 1.5}, {"name": "SQL", "level": "intermediate", "years": 1.5}, {"name": "Statistika", "level": "advanced", "years": 3.0}, {"name": "Excel", "level": "advanced", "years": 4.0}, {"name": "Tableau", "level": "beginner", "years": 0.5}]	[{"title": "Intern Data Analyst", "company": "Bank Mandiri", "end_date": "2024-01", "start_date": "2023-06", "description": "Analisis NPL & dashboard"}]	[{"major": "Statistika", "degree": "S1", "institution": "Universitas Indonesia", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2024}]	Fresh grad statistika UI; magang Bank Mandiri	7000000	12000000	t	[0.16614121,0.2293471,0.28713533,-0.035756476,-0.04478589,-0.036840007,0.17011414,0.2846071,-0.16289061,-0.066817656,0.00939059,-0.029616477,-0.03322824,0.11882708,-0.36117655,-0.14699885,-0.047314126,-0.18961768,0.53490245,0.0028894122,0.018420003,-0.06356707,-0.003250589,0.25282356,-0.15350004,-0.17480944,-0.028894123,0.16722474,-0.19539651,0.085960016,0.04695295,-0.014085885,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.814498+00	2026-06-01 23:29:11.8145+00
41596ede-ddd5-4e64-a66f-fdde79897d85	d2f9843c-eddc-4d17-93a0-1544e3daf18f	Siti Nurhaliza	Akuntan Junior di KAP — 2 tahun audit klien menengah	\N	unverified	\N	3578	[]	[{"name": "Akuntansi", "level": "advanced", "years": 2.5}, {"name": "Excel", "level": "advanced", "years": 3.0}, {"name": "Audit", "level": "intermediate", "years": 2.0}, {"name": "SAP", "level": "beginner", "years": 0.5}]	[{"title": "Junior Auditor", "company": "KAP Tanudiredja Wibisana", "end_date": null, "start_date": "2022-08", "description": "Audit klien manufaktur"}]	[{"major": "Akuntansi", "degree": "D3", "institution": "Politeknik Negeri Surabaya", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2022}]	Audit junior di Surabaya, target FMCG accounting	7000000	11000000	t	[0.099808626,-0.062103145,-0.13677478,-0.13122986,-0.28907534,0.29979554,0.42289284,0.3999738,0.07134468,-0.29092366,0.13455682,-0.020331386,0.0011089847,0.041402094,-0.04953465,-0.10350524,-0.0022179694,-0.10313558,0.21144642,-0.23695306,-0.11089847,0.28685737,0.003326954,0.029203264,-0.042880744,-0.052491944,-0.18298247,-0.08391318,-0.1134861,-0.060254835,-0.14971294,0.15451853,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.824608+00	2026-06-01 23:29:11.824609+00
3cbe571e-3417-4c07-a80f-5eda9e49ff94	c6f946e8-f1b7-4e21-883a-4a07b29f6c1c	Budi Santoso	Teknisi Otomotif — 5 tahun pengalaman bengkel Toyota	\N	unverified	\N	3271	[]	[{"name": "Mechanical", "level": "advanced", "years": 5.0}, {"name": "AutoCAD", "level": "beginner", "years": 1.0}, {"name": "TPM", "level": "intermediate", "years": 2.0}, {"name": "Quality Control", "level": "intermediate", "years": 3.0}]	[{"title": "Mekanik Senior", "company": "Auto2000", "end_date": null, "start_date": "2019-01", "description": "Service & quality check"}]	[{"major": "Teknik Otomotif", "degree": "SMA", "institution": "SMK Negeri 1 Karawang", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2018}]	SMK otomotif, 5 tahun di Auto2000	6000000	10000000	t	[0.15881781,0.2808816,-0.06136909,-0.35000613,-0.09239083,0.011801749,0.30819422,0.022929111,-0.12981923,-0.34022754,-0.15814343,-0.15409711,-0.13453993,-0.0515905,0.05765997,-0.021917533,-0.12577292,-0.087332934,0.10823889,-0.15780623,0.100820646,0.27481213,0.23974408,-0.19860657,-0.10655293,0.23536058,0.030684546,0.078565925,0.012813327,-0.32100755,0.01315052,-0.19894375,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.830751+00	2026-06-01 23:29:11.830754+00
b531fbb0-ce44-48ba-b5b6-78aedca629c3	12b0fccd-bbbf-448d-b3c7-6e1be7c5cf4b	Putri Maharani	Apoteker fresh-graduate UGM — minat QA farmasi	\N	unverified	\N	3471	[]	[{"name": "Farmasi", "level": "advanced", "years": 5.0}, {"name": "CPOB", "level": "intermediate", "years": 1.0}, {"name": "Lab Safety", "level": "intermediate", "years": 1.5}, {"name": "Bahasa Inggris", "level": "intermediate", "years": 3.0}]	[{"title": "Intern Apoteker", "company": "Apotek Kimia Farma", "end_date": "2023-12", "start_date": "2023-06", "description": "PKPA"}]	[{"major": "Farmasi", "degree": "S1", "institution": "Universitas Gadjah Mada", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2024}]	Lulusan Farmasi UGM, lulus apoteker, mencari QA produksi	6500000	11000000	t	[0.094334505,0.18992263,0.21624853,-0.013476358,-0.005327862,0.11345213,0.04418992,0.3930082,0.06362095,0.024445485,0.19901133,-0.18052052,-0.18240094,-0.24633528,-0.34035638,0.14886674,-0.06738179,-0.053278625,0.15419461,-0.026639313,0.2736014,-0.040742476,-0.2131145,-0.1457327,0.09934896,0.29710668,-0.014729973,-0.0062680733,-0.22533724,-0.31873155,-0.040429074,0.05045799,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.836814+00	2026-06-01 23:29:11.836816+00
15fb36ae-52dd-4a3d-b713-a400f0fea1fb	9f39a43a-c713-40da-800c-285206a7be26	Reza Pahlawan	Senior Backend Engineer (Go/Java) — 6 tahun, ingin role remote	\N	unverified	\N	3273	["3174"]	[{"name": "Go", "level": "expert", "years": 5.0}, {"name": "Java", "level": "advanced", "years": 4.0}, {"name": "PostgreSQL", "level": "advanced", "years": 5.0}, {"name": "Kubernetes", "level": "advanced", "years": 3.0}, {"name": "Kafka", "level": "intermediate", "years": 2.0}, {"name": "Docker", "level": "expert", "years": 5.0}, {"name": "gRPC", "level": "advanced", "years": 3.0}]	[{"title": "Senior Engineer", "company": "Tokopedia", "end_date": null, "start_date": "2020-03", "description": "Microservice marketplace"}, {"title": "Software Engineer", "company": "Bukalapak", "end_date": "2020-02", "start_date": "2017-07", "description": "Backend payment"}]	[{"major": "Informatika", "degree": "S2", "institution": "Institut Teknologi Bandung", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2019}, {"major": "Teknik Informatika", "degree": "S1", "institution": "Institut Teknologi Bandung", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2017}]	S2 ITB CS, 6 tahun backend, fokus Go di Tokopedia	28000000	45000000	t	[0.25265595,-0.15072498,0.084814735,-0.17678252,-0.24269277,-0.10295282,0.022991946,0.16426468,0.042151902,-0.10959494,0.0030655928,-0.26542926,-0.29991716,-0.23707251,0.16349828,0.17754892,-0.023247413,-0.31039128,0.15072498,-0.1739724,0.1152152,0.05390334,0.17524973,-0.15762256,-0.0025546607,0.35714155,-0.084814735,-0.053647876,-0.1001427,0.1009091,-0.3116686,-0.112916,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.842393+00	2026-06-01 23:29:11.842395+00
c4d07686-6ecb-4c43-8810-0a118cf372a3	73ca2f64-8e3b-409b-a67e-6742c019506d	Maya Sari	Admin retail SMA lulusan — siap belajar entry-level	\N	unverified	\N	3175	[]	[{"name": "Excel", "level": "beginner", "years": 1.0}, {"name": "Komunikasi", "level": "intermediate", "years": 1.5}, {"name": "Customer Service", "level": "intermediate", "years": 1.0}, {"name": "Bahasa Indonesia", "level": "advanced", "years": 1.5}]	[{"title": "Admin Toko", "company": "Alfamart", "end_date": null, "start_date": "2023-01", "description": "Stok & kasir"}]	[{"major": "IPS", "degree": "SMA", "institution": "SMA Negeri 50 Jakarta", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2022}]	Lulusan SMA, 1 tahun admin Alfamart	4000000	6500000	t	[-0.13207717,0.106023595,0.057173133,0.14763695,-0.034014396,-0.35244703,-0.10312875,0.060067974,-0.1165174,-0.17296682,-0.031119553,-0.26885846,-0.20082968,0.11905038,-0.4765634,-0.0003618553,-0.21892244,-0.35498002,0.05427829,0.14872251,-0.035461817,0.09118753,-0.019178329,0.09480608,-0.053192727,0.07997002,0.1342483,-0.15016994,0.09444423,-0.16645342,-0.10312875,-0.30540586,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.848964+00	2026-06-01 23:29:11.848966+00
32ed2a9d-8fc2-48c0-a8ed-297874564b72	fcf610dd-84ab-4a4d-ac4e-e5c93b43c361	Joko Widodo Pratama	Supply chain analyst — 3 tahun di manufaktur tekstil Solo	\N	unverified	\N	3372	[]	[{"name": "Supply Chain", "level": "advanced", "years": 3.0}, {"name": "Excel", "level": "advanced", "years": 4.0}, {"name": "SAP", "level": "intermediate", "years": 2.0}, {"name": "S&OP", "level": "intermediate", "years": 2.0}, {"name": "Power BI", "level": "beginner", "years": 0.5}]	[{"title": "Supply Chain Analyst", "company": "PT Sritex", "end_date": null, "start_date": "2021-08", "description": "S&OP & demand planning"}]	[{"major": "Teknik Industri", "degree": "S1", "institution": "Universitas Gadjah Mada", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2021}]	S1 TI UGM, 3 tahun supply chain Sritex Solo	10000000	16000000	t	[0.17591621,-0.18099073,0.22722511,-0.25090614,0.087958105,-0.068787746,0.35014093,0.2686669,-0.017760772,-0.19649616,0.16294803,-0.13334675,-0.055819567,0.089931525,-0.33801848,0.10797422,0.034111958,0.01127668,0.001973419,-0.25654447,-0.022835277,0.100080535,0.18662906,-0.04031413,0.024808697,0.16548528,-0.17648004,0.021143775,-0.32279497,0.049335476,-0.25908172,0.21594843,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.853845+00	2026-06-01 23:29:11.853847+00
25e8b020-9411-4637-94a7-463209c9f02c	63b53475-b950-4ed4-b56b-7719e5594e54	Dewi Kartika	Content writer & digital marketer — 4 tahun di media & startup	\N	unverified	\N	3174	[]	[{"name": "Content Writing", "level": "advanced", "years": 4.0}, {"name": "SEO", "level": "advanced", "years": 3.0}, {"name": "Bahasa Indonesia", "level": "expert", "years": 4.0}, {"name": "Bahasa Inggris", "level": "advanced", "years": 3.0}, {"name": "WordPress", "level": "advanced", "years": 3.0}, {"name": "Marketing", "level": "intermediate", "years": 2.0}]	[{"title": "Senior Writer", "company": "IDN Times", "end_date": null, "start_date": "2022-01", "description": "Artikel viral & SEO"}, {"title": "Content Writer", "company": "Kompas.com", "end_date": "2021-12", "start_date": "2020-08", "description": "Newsroom"}]	[{"major": "Ilmu Komunikasi", "degree": "S1", "institution": "Universitas Indonesia", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2020}]	S1 Komunikasi UI, 4 tahun content writer	9000000	14000000	t	[0.21798617,-0.05687536,-0.26253492,0.052550234,-0.16565219,0.09104382,0.23052901,0.10683052,-0.28589058,-0.21409355,0.04909014,-0.23636793,-0.12002214,-0.17819504,-0.10618175,-0.014705416,0.030924624,-0.16521966,-0.05687536,-0.28113294,0.2281502,-0.091476336,0.17084233,-0.16024578,-0.077635944,0.022706892,-0.44008118,-0.035898514,0.22836645,-0.070499495,0.21517484,0.05514531,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.85895+00	2026-06-01 23:29:11.858952+00
5ae92435-09c7-4428-8f0a-a9aedfc03e26	ca8c69e4-1962-4bec-bc9b-c857acb0f828	Hendra Setiawan	Hotel ops 2 tahun di Bali — sales target perhotelan budget	\N	unverified	\N	5171	[]	[{"name": "Hospitality", "level": "advanced", "years": 2.0}, {"name": "Sales", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Inggris", "level": "advanced", "years": 3.0}, {"name": "Customer Service", "level": "advanced", "years": 2.0}]	[{"title": "Front Office Supervisor", "company": "RedDoorz Plus Bali", "end_date": null, "start_date": "2022-06", "description": "Operasional FO"}]	[{"major": "Manajemen Perhotelan", "degree": "D4", "institution": "STP Nusa Dua Bali", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2022}]	D4 Perhotelan Nusa Dua, 2 tahun front office RedDoorz	6000000	11000000	t	[0.10589355,0.04996586,0.017885506,-0.2208718,-0.052237034,-0.18652028,-0.13399935,-0.14592302,-0.011355877,-0.21604556,-0.16948646,-0.18368131,0.13570273,0.027254105,-0.0025550723,0.13087648,-0.035771012,0.073245406,-0.0922665,-0.29809177,0.02498293,0.1572789,0.31768066,-0.1851008,-0.4695655,0.03860998,-0.16324073,-0.033499837,0.27140546,-0.27850288,0.15358824,-0.16040176,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.865103+00	2026-06-01 23:29:11.865105+00
c0515b02-cd5f-4963-9ebe-09eb3019cc6e	2475f184-796e-462a-ad42-2ee63ac53b94	Linda Halim	Banker 7 tahun BCA — ingin pivot ke product/risk fintech	\N	unverified	\N	3171	[]	[{"name": "Risk Management", "level": "advanced", "years": 5.0}, {"name": "Banking", "level": "expert", "years": 7.0}, {"name": "SQL", "level": "intermediate", "years": 2.0}, {"name": "Excel", "level": "expert", "years": 7.0}, {"name": "Statistika", "level": "intermediate", "years": 2.0}]	[{"title": "Relationship Manager", "company": "Bank BCA", "end_date": null, "start_date": "2019-04", "description": "Korporat & UKM"}, {"title": "MT Program", "company": "Bank BCA", "end_date": "2019-03", "start_date": "2017-09", "description": "Management trainee"}]	[{"major": "Manajemen", "degree": "S1", "institution": "Universitas Trisakti", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2017}]	S1 Manajemen Trisakti, 7 tahun BCA	18000000	28000000	t	[-0.0728469,0.0728469,-0.09697304,-0.06230635,0.18270282,-0.09720727,0.27733353,0.029982002,-0.15834245,-0.2532074,-0.022486502,-0.08010816,-0.28295514,-0.043333363,-0.14241451,-0.047549583,0.1567028,-0.27428848,0.29326147,0.010306314,0.21502717,-0.004216219,0.15295506,-0.19628842,-0.38250476,0.079171225,-0.22088303,0.11828837,0.17520732,-0.011945954,-0.3084867,-0.13936946,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.870229+00	2026-06-01 23:29:11.870231+00
1454e5e6-9cca-45fe-9240-6a65e78c85d3	89f8c9c4-3374-4856-947e-ca32206fc776	Agus Salim	Cook 3 tahun di restoran Bandung — ingin role F&B ops	\N	unverified	\N	3273	[]	[{"name": "Hospitality", "level": "advanced", "years": 3.0}, {"name": "Food Safety", "level": "intermediate", "years": 2.0}, {"name": "Operasional", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Indonesia", "level": "advanced", "years": 3.0}]	[{"title": "Cook 1", "company": "Karnivor Bandung", "end_date": null, "start_date": "2021-02", "description": "Line cook western"}]	[{"major": "Tata Boga", "degree": "SMA", "institution": "SMK Pariwisata Bandung", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2020}]	SMK Boga + 3 tahun line cook	5000000	8000000	t	[-0.2554794,-0.02877814,0.027016213,-0.1800102,-0.28249562,0.090445586,0.27955908,0.0458101,-0.21084392,-0.3453377,-0.19909774,-0.16004169,0.111001395,0.09103289,-0.10806485,0.0458101,-0.03582585,0.058437243,0.06254841,0.04111163,0.1400732,0.030833721,0.0061667445,-0.35737753,-0.03788143,0.082810566,-0.10542196,-0.015563688,0.31538492,-0.061961096,0.1406605,-0.409648,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.875515+00	2026-06-01 23:29:11.875516+00
1d09b19f-c1cd-4f6c-938e-587d3fd112be	d33464dc-44d3-4ac1-bad9-e5052b8a92f5	Rina Wijaya	UI Designer freelance — 3 tahun di startup & agency	\N	unverified	\N	3273	["3174"]	[{"name": "Figma", "level": "expert", "years": 3.0}, {"name": "UI/UX", "level": "advanced", "years": 3.0}, {"name": "Design System", "level": "intermediate", "years": 2.0}, {"name": "Prototyping", "level": "advanced", "years": 3.0}, {"name": "Illustration", "level": "advanced", "years": 4.0}]	[{"title": "UI Designer", "company": "Freelance", "end_date": null, "start_date": "2021-07", "description": "Klien startup edukasi & B2B"}]	[{"major": "Desain Komunikasi Visual", "degree": "S1", "institution": "Institut Teknologi Bandung", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2021}]	S1 DKV ITB, freelance UI designer	11000000	18000000	t	[0.1375035,0.19603914,-0.22558308,0.20294192,-0.39124995,0.30924484,-0.025402255,0.12922017,-0.0008283344,0.0433495,-0.23994087,-0.2311053,0.049976178,0.084213994,-0.1805769,0.05246118,0.06875175,0.09001234,0.26920867,-0.038931716,0.029543927,0.042245056,0.049976178,-0.29488704,-0.106026806,-0.17892022,-0.18002468,-0.25402254,-0.04914784,-0.20404637,-0.21840417,0.12590683,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.880652+00	2026-06-01 23:29:11.880654+00
d7db418d-228f-49b4-887e-bd8f39be10a1	0f064669-4638-4341-92fd-48782c954936	Bayu Aditya	Project engineer konstruksi 4 tahun — sertifikasi K3	\N	unverified	\N	3578	[]	[{"name": "AutoCAD", "level": "advanced", "years": 4.0}, {"name": "Project Management", "level": "intermediate", "years": 3.0}, {"name": "K3", "level": "advanced", "years": 4.0}, {"name": "MS Project", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Inggris", "level": "intermediate", "years": 2.0}]	[{"title": "Project Engineer", "company": "Waskita Karya", "end_date": null, "start_date": "2020-09", "description": "Tol Trans-Sumatra"}]	[{"major": "Teknik Sipil", "degree": "S1", "institution": "Institut Teknologi Sepuluh Nopember", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2020}]	S1 Sipil ITS + 4 tahun Waskita	11000000	17000000	t	[0.06684492,-0.1369827,-0.1369827,-0.013500698,0.10438345,0.046758514,0.28022182,-0.0335871,-0.3724217,-0.35694528,0.14521483,-0.28384393,-0.22127974,-0.123482,-0.11590844,0.007902848,0.040502094,-0.28977108,-0.017452123,-0.02107426,0.21140118,-0.09154132,0.065198496,-0.08232133,-0.13237269,-0.18999763,-0.10734701,-0.023049973,0.1547641,0.22095045,-0.18011907,-0.31347963,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.885811+00	2026-06-01 23:29:11.885813+00
e62d43d0-ee5f-479f-a828-7e4759ccb672	4860d41f-e420-4514-a044-af1f51274ef8	Nadia Putri	HR generalist 2 tahun — minat People Analytics	\N	unverified	\N	3174	[]	[{"name": "Human Resources", "level": "advanced", "years": 2.0}, {"name": "Recruitment", "level": "advanced", "years": 2.0}, {"name": "Excel", "level": "advanced", "years": 4.0}, {"name": "Statistika", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Inggris", "level": "advanced", "years": 4.0}]	[{"title": "HR Generalist", "company": "Halodoc", "end_date": null, "start_date": "2023-08", "description": "Recruitment & employee experience"}]	[{"major": "Psikologi Industri", "degree": "S2", "institution": "Universitas Indonesia", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2023}, {"major": "Psikologi", "degree": "S1", "institution": "Universitas Padjadjaran", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2021}]	S2 Psikologi UI, 2 tahun HR Halodoc	11000000	18000000	t	[0.054610692,-0.14926922,0.17839493,-0.0532868,-0.0023168174,-0.253526,0.17607811,0.17773299,-0.29522872,-0.34719163,0.118157685,-0.33196682,0.024823042,-0.12643203,0.114516966,-0.25815964,-0.29986235,-0.10359483,0.03706908,-0.19726044,0.202887,-0.044019528,-0.09664438,-0.12941079,-0.34785357,0.10855944,-0.091679774,-0.054610692,-0.10822847,0.1356993,-0.01853454,-0.014231877,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.891105+00	2026-06-01 23:29:11.891107+00
87d6ec21-b24c-4591-b4d6-51c6129ade92	b69e13b2-8290-4759-a85c-0ae3e975c377	Faisal Rahman	Maintenance technician 5 tahun di pabrik tekstil	\N	unverified	\N	3273	[]	[{"name": "Mechanical", "level": "advanced", "years": 5.0}, {"name": "PLC", "level": "intermediate", "years": 3.0}, {"name": "Quality Control", "level": "intermediate", "years": 3.0}, {"name": "TPM", "level": "advanced", "years": 4.0}]	[{"title": "Maintenance Tech", "company": "PT Trisula Textile", "end_date": null, "start_date": "2019-07", "description": "Mesin tenun & finishing"}]	[{"major": "Teknik Mesin", "degree": "D3", "institution": "Politeknik Negeri Bandung", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2019}]	D3 Polban Mesin + 5 tahun maintenance	6500000	11000000	t	[0.25280684,0.069176,0.1003052,-0.016036255,-0.138352,0.20532694,0.14149636,-0.16162029,-0.018866181,-0.13111997,0.28142056,-0.2031259,0.16476466,0.17388332,-0.34713775,-0.09181542,0.110367164,-0.32890043,0.17294,-0.21287341,0.17388332,0.1971516,-0.066974945,-0.26978642,0.07672247,-0.19683717,-0.09778971,-0.14998615,-0.062887274,-0.20784244,-0.07892353,-0.13111997,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.896493+00	2026-06-01 23:29:11.896495+00
e9912a26-6369-4464-bd13-2ec7138fbc22	d3958cf7-a083-419f-837b-07651ab65ee8	Citra Lestari	Legal trainee 1 tahun — pasca ujian advokat	\N	unverified	\N	3573	[]	[{"name": "Hukum", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Inggris", "level": "advanced", "years": 4.0}, {"name": "Riset", "level": "advanced", "years": 3.0}, {"name": "Drafting", "level": "intermediate", "years": 1.5}]	[{"title": "Junior Associate", "company": "Kantor Hukum Lubis Santosa", "end_date": null, "start_date": "2023-09", "description": "Litigasi & corporate"}]	[{"major": "Ilmu Hukum", "degree": "S1", "institution": "Universitas Brawijaya", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2023}]	S1 Hukum UB, 1 tahun KAP litigasi	8000000	13000000	t	[0.0019666338,0.22091854,0.108492635,-0.11045927,-0.007210991,0.27500096,0.38054365,0.025238467,-0.077026494,-0.24320705,0.0757154,-0.28024533,0.19666338,0.08358194,-0.11701471,-0.06817664,-0.24779586,-0.16126397,0.19240235,-0.074404314,0.1563474,0.1740471,-0.18027477,-0.14553091,-0.15798625,-0.11635917,-0.3018783,0.27729538,0.13471442,0.039332677,-0.14290872,0.08784298,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.90177+00	2026-06-01 23:29:11.901772+00
f5396fb9-6dd4-464e-9b6c-48f47756c1ac	df7bae15-3576-4235-bf07-8e7e5759f8eb	Iwan Setyo	Sales pengalaman 8 tahun (retail & property) — target B2B sales	\N	unverified	\N	3471	[]	[{"name": "Sales", "level": "expert", "years": 8.0}, {"name": "Negotiation", "level": "advanced", "years": 6.0}, {"name": "Komunikasi", "level": "expert", "years": 8.0}, {"name": "Customer Service", "level": "advanced", "years": 5.0}]	[{"title": "Sales Executive", "company": "Sinarmas Land", "end_date": null, "start_date": "2019-03", "description": "Penjualan rumah cluster"}, {"title": "Sales Promotor", "company": "Erafone", "end_date": "2019-02", "start_date": "2014-11", "description": "Sales gadget"}]	[{"major": "IPS", "degree": "SMA", "institution": "SMA Negeri 9 Yogyakarta", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2014}]	SMA + 8 tahun sales retail & property	7000000	13000000	t	[0.20724103,0.057755694,0.0736102,-0.35219648,-0.1333477,0.19676572,0.09059717,-0.15344895,0.056057,0.027745383,-0.120890595,-0.30718103,-0.3349264,-0.05662323,0.05011156,0.1225893,-0.255937,-0.3660692,-0.06370114,-0.06058686,-0.028594732,0.094560795,0.14297366,-0.0087766005,-0.23385394,-0.2737733,-0.082103685,-0.02944408,0.05747258,-0.15118402,-0.2961395,-0.03963626,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.906826+00	2026-06-01 23:29:11.906828+00
7a1c4a2a-3c8d-4222-ac1e-a6afc2aacf8c	49b9f663-54a2-4b0f-8379-39acf7e53999	Yuni Astuti	Perawat 6 tahun RS Surabaya — eksplorasi healthtech ops	\N	unverified	\N	3578	[]	[{"name": "Keperawatan", "level": "expert", "years": 6.0}, {"name": "Customer Service", "level": "advanced", "years": 6.0}, {"name": "Health Operations", "level": "intermediate", "years": 2.0}, {"name": "Bahasa Indonesia", "level": "expert", "years": 6.0}]	[{"title": "Perawat IGD", "company": "RS Premier Surabaya", "end_date": null, "start_date": "2018-08", "description": "IGD & rawat inap"}]	[{"major": "Keperawatan", "degree": "D3", "institution": "Akademi Keperawatan Karya Husada", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2018}]	D3 Keperawatan + 6 tahun perawat RS	7500000	13000000	t	[0.18676668,-0.17108819,-0.10232284,-0.3198964,-0.3198964,-0.07646707,0.11250011,0.09627149,-0.18264076,-0.24067873,0.09324581,-0.22252467,0.06931547,-0.16613708,-0.085269034,-0.040709086,-0.26708463,-0.29899174,0.1796151,0.017328868,0.06876535,-0.06601474,-0.03520786,-0.015128377,-0.10369815,-0.21564813,-0.036308106,-0.22610047,0.13312972,-0.2921152,0.21179728,-0.20162,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.9118+00	2026-06-01 23:29:11.911802+00
e147aa92-d4ee-4328-8ace-67c5a3158695	e2f62b3a-de99-4d7a-aa22-3b776e696be2	Aldi Pramudya	QA Tester 1 tahun — target Software Engineer	\N	unverified	\N	3173	[]	[{"name": "QA Testing", "level": "intermediate", "years": 1.5}, {"name": "SQL", "level": "intermediate", "years": 1.5}, {"name": "Python", "level": "beginner", "years": 1.0}, {"name": "Selenium", "level": "beginner", "years": 1.0}, {"name": "Git", "level": "intermediate", "years": 1.5}]	[{"title": "QA Engineer", "company": "Halodoc", "end_date": null, "start_date": "2023-09", "description": "Manual & automation testing"}]	[{"major": "Sistem Informasi", "degree": "S1", "institution": "Universitas Bina Nusantara", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2023}]	S1 SI Binus + 1 tahun QA Halodoc	7500000	12000000	t	[-0.07778033,0.041559096,-0.049565893,0.085787125,0.06824842,-0.07854288,0.2630805,0.30349576,-0.31836554,-0.028976984,-0.038890164,-0.42969817,0.21008313,0.040033992,0.11247645,-0.11438283,-0.25202352,0.04613441,0.4449492,0.22609673,0.1708117,0.040033992,-0.035458677,-0.23181587,-0.022876566,0.025164222,-0.023639118,0.10866369,0.14946023,-0.0430842,0.019826358,0.10866369,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.916891+00	2026-06-01 23:29:11.916893+00
283ecd92-6e18-41ea-a482-69330b5096e5	144c74d7-f42e-4837-b5a6-1e271ca27450	Sri Wahyuni	Field officer pertanian 5 tahun — agritech & food security	\N	unverified	\N	3271	[]	[{"name": "Pertanian", "level": "advanced", "years": 5.0}, {"name": "Komunikasi", "level": "advanced", "years": 5.0}, {"name": "Excel", "level": "intermediate", "years": 3.0}, {"name": "Logistik", "level": "intermediate", "years": 3.0}, {"name": "Bahasa Indonesia", "level": "expert", "years": 5.0}]	[{"title": "Field Trial Officer", "company": "PT East West Seed Indonesia", "end_date": null, "start_date": "2019-08", "description": "Field trial benih hortikultura"}]	[{"major": "Agribisnis", "degree": "S1", "institution": "Institut Pertanian Bogor", "ijazah_number": null, "sivil_verified": "unverified", "graduation_year": 2019}]	S1 Agribisnis IPB + 5 tahun field officer	7000000	12000000	t	[0.14188552,0.0074188504,-0.26120538,-0.05502314,-0.20463663,0.17496122,0.49242622,-0.0092735635,-0.21050988,-0.13601226,0.1579597,-0.14219464,-0.019474482,0.13786697,-0.15672322,-0.29737225,0.005564138,-0.08037088,0.124265745,-0.09613594,0.05842345,0.09644506,0.20185456,-0.17403387,-0.1335393,0.061514635,-0.19010805,0.107882455,-0.25935066,-0.05316843,-0.12890252,-0.2865531,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]	gemini-embedding-001	2026-06-01 23:29:11.921864+00	2026-06-01 23:29:11.921866+00
\.


--
-- Data for Name: skill_gaps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_gaps (id, seeker_id, target_job_id, missing_skills, matching_skills, gap_severity, match_percentage, recommended_courses, estimated_readiness_months, summary, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, is_active, last_login_at, created_at, updated_at) FROM stdin;
d6f97708-71d6-42fe-a6a6-c87239c1907d	hr@goto.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.652362+00	2026-06-01 23:29:11.652366+00
55e8d306-e0da-42e7-aa30-69155251a1c3	hr@mandiri.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.663582+00	2026-06-01 23:29:11.663587+00
e58270f4-8173-448b-9c3d-69adbfb2efe5	hr@bca.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.669153+00	2026-06-01 23:29:11.669156+00
6a0d5e67-5c78-4d2e-ab54-1ac3b8260731	hr@telkom.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.67359+00	2026-06-01 23:29:11.673592+00
87d446bc-833d-4c53-8393-1a183305f7fa	hr@pertamina.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.678362+00	2026-06-01 23:29:11.678364+00
59078236-13cd-4bb3-8dbd-037533591f3b	hr@bibit.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.683123+00	2026-06-01 23:29:11.683125+00
4357eac0-4853-4444-9128-d674d517f932	hr@ruangguru.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.687702+00	2026-06-01 23:29:11.687704+00
006f66e1-9d2c-4c1f-85b9-0813e3a2b89b	hr@halodoc.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.691674+00	2026-06-01 23:29:11.691685+00
b398d77e-3016-4ebf-aa1b-6918a26391fd	hr@indofood.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.696215+00	2026-06-01 23:29:11.696217+00
0ade53d6-c7f6-4dc8-8727-f2a65649699b	hr@garuda.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.700485+00	2026-06-01 23:29:11.700487+00
63bb6919-c375-4d6e-81b1-ba6497623e71	hr@traveloka.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.704555+00	2026-06-01 23:29:11.704557+00
73545ec7-306a-4b45-9e88-eede9fcda73b	hr@sayurbox.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.708495+00	2026-06-01 23:29:11.708497+00
9fad9c42-ef07-46e8-ab7c-d2cfb06a2673	hr@astra.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.712814+00	2026-06-01 23:29:11.712816+00
a83585e1-60d7-4401-bf98-e065752485f7	hr@kalbe.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.716892+00	2026-06-01 23:29:11.716894+00
e1a9ea4c-d64a-43fd-9d22-f216caeb02eb	hr@pegadaian.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.720817+00	2026-06-01 23:29:11.720819+00
3329a173-0f3e-46af-988e-c439a34e2392	hr@unilever.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.725427+00	2026-06-01 23:29:11.72543+00
21f8bed8-2acc-4f26-8019-78935c06d771	hr@reddoorz.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.730576+00	2026-06-01 23:29:11.730578+00
1072c387-fc8a-4f3c-87a8-77cd81487f05	hr@shopee.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.734788+00	2026-06-01 23:29:11.73479+00
dfe4742a-e639-44c0-8ba1-482417456e27	hr@tanihub.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.738979+00	2026-06-01 23:29:11.738981+00
e5eca8ff-c461-4753-a43e-96a9b22f12b2	hr@kalbio.id	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	employer	t	\N	2026-06-01 23:29:11.742983+00	2026-06-01 23:29:11.742985+00
13873fde-2d32-44d1-8c7d-de28d645928d	andi.pratama@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.812231+00	2026-06-01 23:29:11.812233+00
d2f9843c-eddc-4d17-93a0-1544e3daf18f	siti.nurhaliza@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.82268+00	2026-06-01 23:29:11.822683+00
c6f946e8-f1b7-4e21-883a-4a07b29f6c1c	budi.santoso@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.82784+00	2026-06-01 23:29:11.827842+00
12b0fccd-bbbf-448d-b3c7-6e1be7c5cf4b	putri.maharani@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.834699+00	2026-06-01 23:29:11.834702+00
9f39a43a-c713-40da-800c-285206a7be26	reza.pahlawan@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.840456+00	2026-06-01 23:29:11.840458+00
73ca2f64-8e3b-409b-a67e-6742c019506d	maya.sari@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.846498+00	2026-06-01 23:29:11.846501+00
fcf610dd-84ab-4a4d-ac4e-e5c93b43c361	joko.widodo.p@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.851925+00	2026-06-01 23:29:11.851926+00
63b53475-b950-4ed4-b56b-7719e5594e54	dewi.kartika@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.856826+00	2026-06-01 23:29:11.856828+00
ca8c69e4-1962-4bec-bc9b-c857acb0f828	hendra.setiawan@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.863136+00	2026-06-01 23:29:11.863138+00
2475f184-796e-462a-ad42-2ee63ac53b94	linda.halim@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.868435+00	2026-06-01 23:29:11.868437+00
89f8c9c4-3374-4856-947e-ca32206fc776	agus.salim@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.873662+00	2026-06-01 23:29:11.873664+00
d33464dc-44d3-4ac1-bad9-e5052b8a92f5	rina.wijaya@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.878969+00	2026-06-01 23:29:11.878972+00
0f064669-4638-4341-92fd-48782c954936	bayu.aditya@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.884094+00	2026-06-01 23:29:11.884096+00
4860d41f-e420-4514-a044-af1f51274ef8	nadia.putri@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.889222+00	2026-06-01 23:29:11.889225+00
b69e13b2-8290-4759-a85c-0ae3e975c377	faisal.rahman@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.894412+00	2026-06-01 23:29:11.894414+00
d3958cf7-a083-419f-837b-07651ab65ee8	citra.lestari@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.89956+00	2026-06-01 23:29:11.899561+00
df7bae15-3576-4235-bf07-8e7e5759f8eb	iwan.setyo@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.904759+00	2026-06-01 23:29:11.90476+00
49b9f663-54a2-4b0f-8379-39acf7e53999	yuni.astuti@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.910332+00	2026-06-01 23:29:11.910334+00
e2f62b3a-de99-4d7a-aa22-3b776e696be2	aldi.pramudya@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.915233+00	2026-06-01 23:29:11.915235+00
144c74d7-f42e-4837-b5a6-1e271ca27450	sri.wahyuni@example.com	$2b$12$demoDemoDemoDemoDemoDe.uM5RyP4OkmdRY3hCmF5wxJ2sLb7gqXa	seeker	t	\N	2026-06-01 23:29:11.920239+00	2026-06-01 23:29:11.920242+00
\.


--
-- Name: ai_logs ai_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_logs
    ADD CONSTRAINT ai_logs_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- Name: gamification gamification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gamification
    ADD CONSTRAINT gamification_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: seekers seekers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seekers
    ADD CONSTRAINT seekers_pkey PRIMARY KEY (id);


--
-- Name: skill_gaps skill_gaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gaps
    ADD CONSTRAINT skill_gaps_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_applications_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_applications_job_id ON public.applications USING btree (job_id);


--
-- Name: ix_applications_seeker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_applications_seeker_id ON public.applications USING btree (seeker_id);


--
-- Name: ix_conversations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_conversations_user_id ON public.conversations USING btree (user_id);


--
-- Name: ix_employers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employers_user_id ON public.employers USING btree (user_id);


--
-- Name: ix_gamification_seeker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gamification_seeker_id ON public.gamification USING btree (seeker_id);


--
-- Name: ix_jobs_employer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_jobs_employer_id ON public.jobs USING btree (employer_id);


--
-- Name: ix_matches_subject_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_matches_subject_id ON public.matches USING btree (subject_id);


--
-- Name: ix_seekers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_seekers_user_id ON public.seekers USING btree (user_id);


--
-- Name: ix_skill_gaps_seeker_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_skill_gaps_seeker_id ON public.skill_gaps USING btree (seeker_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: employers employers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: jobs jobs_employer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.employers(id);


--
-- Name: seekers seekers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seekers
    ADD CONSTRAINT seekers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict t2rdGrfdURPqopZSMnS5lt6cqJPiSz0GJYyu6hsb4J1IhYiTSPIvHiqCfzEnqZe


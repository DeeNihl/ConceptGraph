-- Table: omop_vocab.concept_ancestor

-- DROP TABLE IF EXISTS omop_vocab.concept_ancestor;

CREATE TABLE IF NOT EXISTS omop_vocab.concept_ancestor
(
    ancestor_concept_id integer NOT NULL,
    descendant_concept_id integer NOT NULL,
    min_levels_of_separation integer NOT NULL,
    max_levels_of_separation integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_ancestor
    OWNER to postgres;
-- Index: idx_concept_ancestor_id_1

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_ancestor_id_1;

CREATE INDEX IF NOT EXISTS idx_concept_ancestor_id_1
    ON omop_vocab.concept_ancestor USING btree
    (ancestor_concept_id ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_ancestor
    CLUSTER ON idx_concept_ancestor_id_1;
-- Index: idx_concept_ancestor_id_2

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_ancestor_id_2;

CREATE INDEX IF NOT EXISTS idx_concept_ancestor_id_2
    ON omop_vocab.concept_ancestor USING btree
    (descendant_concept_id ASC NULLS LAST)
    TABLESPACE pg_default;
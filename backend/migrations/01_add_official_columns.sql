-- Migration: Add Official and Extra Match Info columns to 'matches' table
DO $$ 
BEGIN 
    -- 1. Add ID columns for Officials (Foreign Keys)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='referee_1_id') THEN
        ALTER TABLE matches ADD COLUMN referee_1_id INTEGER REFERENCES referees(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='referee_2_id') THEN
        ALTER TABLE matches ADD COLUMN referee_2_id INTEGER REFERENCES referees(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='scorer_id') THEN
        ALTER TABLE matches ADD COLUMN scorer_id INTEGER REFERENCES scorers(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='line_judge_1_id') THEN
        ALTER TABLE matches ADD COLUMN line_judge_1_id INTEGER REFERENCES line_judges(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='line_judge_2_id') THEN
        ALTER TABLE matches ADD COLUMN line_judge_2_id INTEGER REFERENCES line_judges(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='line_judge_3_id') THEN
        ALTER TABLE matches ADD COLUMN line_judge_3_id INTEGER REFERENCES line_judges(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='line_judge_4_id') THEN
        ALTER TABLE matches ADD COLUMN line_judge_4_id INTEGER REFERENCES line_judges(id);
    END IF;

    -- 2. Add Extra Info Columns for FIVB Scoresheet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='rr_name') THEN
        ALTER TABLE matches ADD COLUMN rr_name TEXT, ADD COLUMN rr_country TEXT, ADD COLUMN rr_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='rc_name') THEN
        ALTER TABLE matches ADD COLUMN rc_name TEXT, ADD COLUMN rc_country TEXT, ADD COLUMN rc_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='assistant_scorer_name') THEN
        ALTER TABLE matches ADD COLUMN assistant_scorer_name TEXT, ADD COLUMN assistant_scorer_country TEXT, ADD COLUMN assistant_scorer_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='td_name') THEN
        ALTER TABLE matches ADD COLUMN td_name TEXT, ADD COLUMN td_country TEXT, ADD COLUMN td_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='rd_name') THEN
        ALTER TABLE matches ADD COLUMN rd_name TEXT, ADD COLUMN rd_country TEXT, ADD COLUMN rd_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='city') THEN
        ALTER TABLE matches ADD COLUMN city TEXT;
    END IF;

    -- 3. Add Winner Column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='winner_team_id') THEN
        ALTER TABLE matches ADD COLUMN winner_team_id INTEGER REFERENCES teams(id);
    END IF;

END $$;
